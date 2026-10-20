# Bot protection (Arcjet)

Arcjet decides, for each request to a page that serves directory data,
whether the client is a bot we do not want. On an **enforced** host a denied
request gets a `403` and the branded page in
`src/app/(app)/[locale]/(rest)/forbidden.tsx`; on any other host the denial
is only logged and the page is served. Search engines, link previews,
monitors, and AI assistants fetching a page for a person are allowed
(ISS-1728, ISS-2305).

## Where it is configured

Only in environment variables on the DigitalOcean App Platform apps, never in
Payload. Every tenant gets the same protection: there is deliberately no
per-tenant setting, so the rollout does not depend on CMS changes.

| Variable | Default | Effect |
| --- | --- | --- |
| `ARCJET_KEY` | unset | Unset: Arcjet is off everywhere (`SKIPPED`, no call). |
| `ARCJET_ENFORCED_HOSTS` | unset | Comma list of hosts, or `*` for all. Unset or empty: nothing is enforced (log-only everywhere). This is the kill switch. |
| `ARCJET_UNENFORCED_HOSTS` | unset | Hosts never enforced, also under `*`. Wins over `ARCJET_ENFORCED_HOSTS`. |
| `ARCJET_TIMEOUT_MS` | `500` | Decide API timeout. On timeout the request is served (fail open). |
| `ARCJET_LOG_LEVEL` | `info` | SDK log level. `debug` only for a short diagnostic window. |

Host matching uses the `host` header only, case-insensitive, without port or
trailing dot. `x-forwarded-host` is ignored.

| App | Use |
| --- | --- |
| `norse2-prod-search` | Shared production app (all tenants except MBOA) |
| `norse2-prod-search-mboa` | MBOA production app |
| `norse-dev-search`, `norse-dev-search-mboa` | Development apps. Keep `ARCJET_ENFORCED_HOSTS` unset here: e2e runs against these hosts with headless Chromium (see "Tests"). |

To change a variable: DigitalOcean console → the app → **Settings** → the web
component → **Environment Variables**, scope **Run time** → Save. App Platform
redeploys the app; the change is live after the redeploy, a few minutes.

## Architecture

```
page.tsx / generateMetadata
  └ protectPage(path)            src/lib/arcjet-page.ts  (React cache: one decision per request)
      └ arcjetProtect            src/lib/arcjet/index.ts
          ├ isMboaWithoutClientIp → ipSrc   client-ip.ts
          ├ aj.protect(request)             rules.ts (detectBot LIVE, no-UA filter DRY_RUN)
          ├ isEnforcedHost                  enforcement.ts
          └ logs                            redact.ts
      └ denied && enforced → forbidden() → 403 + forbidden.tsx
```

- **Where it runs.** `protectPage(path)` is awaited at the top of each page
  that serves directory data, before any fetch and before anything streams,
  and also in that page's `generateMetadata` when it fetches directory data.
  It does not run in `src/proxy.ts`: Arcjet recommends calls in the route, and
  a middleware call would also run (and bill) on every RSC navigation and
  prefetch. React `cache` makes the page and `generateMetadata` share one
  decision.
- **Covered routes:** `/[locale]/search`, `/[locale]/search/[id]`,
  `/[locale]/details/original/[original_id]`. Server Actions and
  `/api/resource-titles` are not covered yet (follow-up ticket).
- **The 403 is real only before streaming.** Do not move the call below a
  `<Suspense>` boundary or into a segment with `loading.tsx`: the status
  becomes `200`. `forbidden()` needs `experimental.authInterrupts` in
  `next.config.js`.
- **Rules** (`src/lib/arcjet/rules.ts`): `detectBot` in `LIVE` with the allow
  list `ARCJET_ALLOWED_BOTS`, and a `filter` in `DRY_RUN` that denies
  requests with no `User-Agent` (ISS-1744). AI training crawlers are denied
  and also disallowed in `src/app/robots.ts`; keep the two lists in agreement.
- **Client IP** (`src/lib/arcjet/client-ip.ts`): the SDK resolves it through
  `cloudflare()` and `MBOA_PROXY_IP`. MBOA internal traffic (only private hops
  behind the mn.gov proxy) gets `ipSrc` set to the hop that proxy appended;
  see [architecture.md](/docs/architecture.md#mboa--a-specific-tenant-deployment).
- **Fail open.** A missing key, an SDK error or a timeout never blocks a
  request.
- **Cost.** Every request to a covered page is one Arcjet decision request,
  enforced or not, so usage counts from the observe-only stage onward.

### Logs

| Event | When | Contents |
| --- | --- | --- |
| `arcjet_denied` | A denial | host, path, reason, `deniedBots`, `decisionId`, `enforced`, `sampledOutSinceLast`. At most 30 lines per minute per process; the rest are counted in the next line. |
| `arcjet_dry_run_match` | A `DRY_RUN` rule matched | host, path, rule, `decisionId` |
| `arcjet_fingerprint_failed` | SDK threw or the decision errored (includes timeouts) | host, path, error, redacted headers. Sampled, 5 per minute; `*_sampled_out` otherwise. |
| `arcjet_no_client_ip` | MBOA traffic with no routable client IP | host, path, masked hops, redacted headers. Sampled as above. |

Every denial, enforced or not, also sends one `bot_blocked` Umami event
after the response; see
[blocked-traffic-analytics.md](/docs/blocked-traffic-analytics.md).

Decision logs contain no IP address: find the request in the Arcjet console
by `decisionId`. Events with no decision log headers from an allow list only,
with every IP masked (`maskIp`). Paths never include the query string.

## Rollout procedure

1. Deploy with `ARCJET_ENFORCED_HOSTS` unset. Every host is observe-only.
2. Do the staging checks in ISS-2423.
3. Read `arcjet_denied` in the logs and the Arcjet console for 2 to 3 days.
4. Set `ARCJET_ENFORCED_HOSTS` to one agreed host. Watch `arcjet_denied`
   with `enforced: true` on it for some days.
5. Set `ARCJET_UNENFORCED_HOSTS=mboa.c211.io` on both production apps.
6. Set `ARCJET_ENFORCED_HOSTS=*`. New tenants are then enforced from their
   first request; read `arcjet_denied` for a new host in its first week.
7. Remove `mboa.c211.io` from `ARCJET_UNENFORCED_HOSTS` only after MNIT
   replies (ISS-1737).

## Recovery runbook

Anyone with access to the DigitalOcean App Platform apps can do these. Each
takes effect after the redeploy, a few minutes.

| Situation | Action |
| --- | --- |
| Real people are blocked on one host | Add that host to `ARCJET_UNENFORCED_HOSTS`. |
| Real people are blocked everywhere | Set `ARCJET_ENFORCED_HOSTS` to empty. Arcjet keeps logging. |
| Arcjet is slow or down | Nothing: requests fail open after `ARCJET_TIMEOUT_MS`. To stop calling it at all, unset `ARCJET_KEY`. |
| A bot we need is denied | Add its Arcjet label to `ARCJET_ALLOWED_BOTS` (code change and deploy). Meanwhile, unenforce the affected host. |

Until the redeploy finishes, blocked people see the 403 page. Read the
`arcjet_denied` lines (`deniedBots`, `decisionId`) to find which rule or bot
label caused it.

## Tests

- Unit: `tests/arcjet.test.ts` (rules, enforcement, client IP, logging).
- E2E runs in CI against the dev hosts only, which stay unenforced. It does
  not run against production, where headless Chromium is expected to be
  denied.
- No automated check covers the real `403` from `forbidden()`. Check it on
  staging (ISS-2423): a browser user agent gets `200`, `curl` gets `403`.
