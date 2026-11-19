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
| `ARCJET_RATE_LIMIT_PER_MINUTE` | `60` | Requests one client IP may make to covered pages per sliding minute. `0` removes the rate-limit rule. |
| `ARCJET_LOG_LEVEL` | `info` | SDK log level. `debug` only for a short diagnostic window. |

Host matching uses the `host` header only, case-insensitive, without port or
trailing dot. `x-forwarded-host` is ignored.

| App | Use |
| --- | --- |
| `norse2-prod-search` | Shared production app (all tenants except MBOA) |
| `norse2-prod-search-mboa` | MBOA production app |
| `norse-dev-search`, `norse-dev-search-mboa` | Development apps. Keep `ARCJET_ENFORCED_HOSTS` unset here: e2e runs against these hosts with headless Chromium (see "Tests"). |

To change a variable: DigitalOcean console → the app → **Settings** →
`norse-app` → **Environment Variables**, scope **Run time** → Save. App Platform
redeploys the app; the change is live after the redeploy, a few minutes.

## Architecture

```
page.tsx / generateMetadata
  └ protectPage(path)            src/lib/arcjet-page.ts  (React cache: one decision per request)
      ├ isEnforcedHost             enforcement.ts
      ├ enforced:     await arcjetProtect → denied → forbidden() → 403 + forbidden.tsx
      └ not enforced: after(arcjetProtect)  (after the response; logs and counts only)

server action (print)
  └ protectAction({ route: 'print', path })   same decision, method POST, route rules

src/proxy.ts                      sets x-norse-req-method / -client-headers /
                                  -client-returning / -query-keys (always overwritten)
prepare(path, route)              buildArcjetRequest (request.ts): path, method,
                                  client headers, aj_signals cookie only
arcjet.protect span               src/lib/arcjet-page.ts
  ├ BurstDetector.record(host)      decision-sampling.ts
  ├ arcjetProtect                   src/lib/arcjet/index.ts
  │   ├ isMboaWithoutClientIp → ipSrc   client-ip.ts
  │   ├ arcjetClientFor: per-IP rate limit client, or none for MBOA ipSrc
  │   └ client[.withRule(routeRules)].protect(request, { correlationId, metadata })
  ├ span attributes, metrics        telemetry/arcjet.ts
  └ arcjet_decision record          decision-record.ts → telemetry/arcjet-decision-log.ts (OTel Logs only)
```

- **Where it runs.** `protectPage(path)` is awaited at the top of each page
  that serves directory data, before any fetch and before anything streams,
  and also in that page's `generateMetadata` when it fetches directory data.
  It does not run in `src/proxy.ts`: Arcjet recommends calls in the route, and
  a middleware call would also run (and bill) on every RSC navigation and
  prefetch. React `cache` makes the page and `generateMetadata` share one
  decision.
- **Only enforced hosts wait for Arcjet.** On an enforced host the page
  waits for the decision (up to `ARCJET_TIMEOUT_MS`) so it can answer `403`.
  On every other host a denial cannot change the response, so the decision
  runs in `after()`, once the response is sent: it still writes its
  `arcjet_decision` record and the per-crawler counts, but adds no
  latency. Awaiting it everywhere, as v2.30.0 did, put up to 500 ms on every
  observe-only page view and held renders open under load.
- **Covered routes:** `/[locale]/search`, `/[locale]/search/[id]`,
  `/[locale]/details/original/[original_id]`, and the route handler
  `/api/search-pins` (through `isRouteDenied`, which answers a JSON `403`),
  and the print server action `getPrintableDirectoryData` (through
  `protectAction`, see "Print action" below). Other server actions and
  `/api/resource-titles` are not covered yet (follow-up ticket).
- **The 403 is real only before streaming.** Do not move the call below a
  `<Suspense>` boundary or into a segment with `loading.tsx`: the status
  becomes `200`. `forbidden()` needs `experimental.authInterrupts` in
  `next.config.js`.
- **Rules** (`src/lib/arcjet/rules.ts`). Base rules, on every route: the
  per-IP `slidingWindow` in `LIVE` (below); `detectBot` in `LIVE` with the allow list `ARCJET_ALLOWED_BOTS`; a `filter`
  in `DRY_RUN` that denies requests with no `User-Agent` (ISS-1744); a
  `filter` in `DRY_RUN` on browsers from hosting networks
  (`HOSTING_IP_FILTER`: `ip.src.hosting and not ip.src.crawler and not
  ip.src.relay and len(http.request.headers["sec-fetch-mode"]) gt 0`,
  recommended by Arcjet on 2026-11-18: about a third of production traffic
  came from cloud and hosting networks, ~123k requests a day claiming to be a
  browser, e.g. Zillion AS54801 with fully consistent browser headers). Before
  promoting it to `LIVE`, read its dry-run matches: it would also block real
  people on VPNs or cloud desktops, and any allowed bot that runs a real
  browser from a cloud IP without being flagged a crawler (look for
  `allowed_bots` on the matches). AI training crawlers are denied
  and also disallowed in `src/app/robotsRules.ts`; keep the two lists in
  agreement.
- **Per-IP rate limit** (`slidingWindow`, `LIVE`): at most
  `ARCJET_RATE_LIMIT_PER_MINUTE` (60) requests per client IP in any 60
  seconds, keyed by Arcjet's default fingerprint (`ip.src`, resolved through
  the proxies below). Counted by Arcjet's Decide API in the same call as the
  bot check, so it adds no request. On an enforced host a client over the
  limit gets the 403 (`reasonType` `RATE_LIMIT`), and the SDK caches the
  denial locally for the TTL Arcjet returns, so its next requests are denied
  without a call. On an observe-only host it is only logged.
  There is no exemption for allowed crawlers: they spread their requests over
  many IPs. It stops single-IP crawlers, not rotating residential proxies,
  which change IP every few seconds. MBOA internal traffic (State
  of Minnesota network behind the mn.gov proxy) is never rate limited: its
  `ipSrc` is the proxy's private hop, shared by every State visitor, so it
  goes through a second Arcjet client with the same bot rules and no rate
  limit (`arcjetClientFor`). With no usable hop at all it skips Arcjet
  entirely (`NO_CLIENT_IP`). MBOA visitors on the public internet have their
  own IP and are limited like everyone else.
- **Rules per route** (`routeRules(route)`, added with `withRule` on top of
  either base client, one client per route built once):

  | Route | Extra rules |
  | --- | --- |
  | `search`, `resource`, `details`, `pins` | none |
  | `print` | `detectBot` `LIVE` allowing only `CATEGORY:SEARCH_ENGINE`, `CATEGORY:PREVIEW` (and `ARCJET_SIGNALS` while observed); `slidingWindow` `DRY_RUN`, 20 per 10 minutes per `norse_visitor` |

  Arcjet rules carry no custom ID, so a dry-run match is read per route from
  the record's `route` plus `dry_run_matches` (`ruleType`, `ruleId`). Promote
  a `DRY_RUN` rule to `LIVE` only after reading those matches.
- **Advanced Signals.** Set the repository Actions variable
  `NEXT_PUBLIC_ARCJET_SCRIPT_URL` (the URL from the Arcjet dashboard, e.g.
  `https://signals-cdn.arcjet.com/aj-sig.js`) for the **build** of both
  DigitalOcean apps (multi-tenant and MBOA): it is inlined at build time. The
  shared deploy workflow passes it only to the public-app image build, where
  the Dockerfile bakes it into the Next.js bundle. Changing the variable alone
  does not trigger a build; dispatch the development workflow or wait for the
  next deployment. The CSP (`ARCJET_SIGNALS_CSP` in `src/lib/arcjet/request.ts`, used by
  `src/proxy.ts`) allows
  `https://signals-cdn.arcjet.com` and `'wasm-unsafe-eval'` in `script-src`,
  `https://signals-cdn.arcjet.com` and `https://signals.arcjet.com` in
  `connect-src`, and `https://signals-cdn.arcjet.com` in `frame-src`.
  `detectBot` reads the `aj_signals` cookie and denies with `ARCJET_SIGNALS`
  when the signals look automated (a missing cookie alone is not a denial).
  `ARCJET_SIGNALS` is in `ARCJET_ALLOWED_BOTS` for now, so such requests show
  in `allowed_bots` without being blocked; remove it once the data shows few
  false positives. Coverage per host: `aj_signals_present` on
  `norse_arcjet_decisions_total` and on the record. Ask Arcjet about the
  data-retention and data-sent options before turning it on everywhere.
- **Client IP** (`src/lib/arcjet/client-ip.ts`): the SDK resolves it through
  `cloudflare()` and `MBOA_PROXY_IP`. MBOA internal traffic (only private hops
  behind the mn.gov proxy) gets `ipSrc` set to the hop that proxy appended;
  see [architecture.md](/docs/architecture.md#mboa--a-specific-tenant-deployment).
- **Fail open.** A missing key, an SDK error or a timeout never blocks a
  request.
- **Cost.** Every request to a covered page is one Arcjet decision request,
  enforced or not, so usage counts from the observe-only stage onward.
  Enforcing a host also adds the Arcjet wait to every page view on it,
  real people included: enforce hosts a few at a time and watch their
  latency.

### What Arcjet receives

`buildArcjetRequest` (`src/lib/arcjet/request.ts`) replaces `request()` from
`@arcjet/next`, which sent no path or method, our response headers
(`set-cookie`, `x-middleware-set-cookie`, `x-frame-options`) and every cookie.

| Field | Value |
| --- | --- |
| `method` | `x-norse-req-method` from the proxy (`GET` for a page render, `POST` for a server action) |
| `url` | the path only, e.g. `/en/search/123`; never the query string (crisis searches, coordinates). With no `nextUrl` the SDK sets `query` to `""` |
| `headers` | only the names the client sent (`x-norse-client-headers`), read from `headers()`; never `x-norse-*`, `x-middleware-*`, `set-cookie` or other response headers. `x-forwarded-for` is kept for IP resolution (including MBOA `ipSrc`). Without the list (a request that skipped the proxy) a denylist drops ours |
| `cookies` | `{ aj_signals }` only, when present |
| `correlationId` | the active `trace_id`: our trace ID is on Arcjet's record, their decision ID on ours |
| `metadata` | `{ tenant_id, route, deployment, client_signature }`; never a user agent, IP or anything personal (Arcjet stores it unredacted) |

The proxy always overwrites the `x-norse-*` headers, so a client can't forge
them. `x-norse-client-returning` is decided there because the proxy sets the
`session-id` cookie on the response: a server component can't tell a new
client from a returning one.

### Print action

`getPrintableDirectoryData` (`POST /search` with a `next-action` header) is
callable by anyone with the action ID from the JS bundle, so:

- **Tenant from the server.** `protectAction` resolves it from the request host
  with the app-config resolution the pages use (`requestTenantId`). The
  client's `tenantId` argument is kept for compatibility and ignored.
- **Arcjet first:** `protectAction({ route: 'print', path: '/<locale>/search' })`,
  method `POST`, base rules plus the print rules. On an enforced host a denial
  returns `null`, which the print dialog shows as its "could not load"
  message; the action never throws for it. On an observe-only host the
  decision runs in `after()`.
- **Every call is logged** (`arcjet_decision`, `route=print`, `ids_requested`,
  `ids_unique`, tenant) and counted in `norse_print_requests_total`. The
  action's own server span carries `arcjet.route` and `arcjet.tenant_id`, so
  print and favorites `/resource/batch` calls can be told apart per tenant.
- **No ID cap yet** (next release): choose it from `ids_requested`.
- **Per-visitor rate limit** (`DRY_RUN`): keyed on `norse_visitor`, a hash of
  the session cookie (or of the client IP without one), never the IP itself,
  since IPs rotate.

### Logs

Every decision outcome is an `arcjet_decision` OTel log record (Loki only,
never stdout); see [observability.md](/docs/observability.md#arcjet_decision)
for its fields and sampling. The pino events `arcjet_denied`,
`arcjet_dry_run_match` and `arcjet_fingerprint_failed` are gone. Only MBOA's
`arcjet_no_client_ip` remains (debug, masked, sampled 5 per minute).

The SDK's own logging goes through `arcjet({ log })` (`sdk-log.ts`): `debug`
and `info` to OTel Logs only (scope `arcjet-sdk`), `warn` and `error` to pino.
Set `ARCJET_LOG_LEVEL=warn` in both DO apps.

Every denial, enforced or not, and every request from an allowed crawler is
also counted per crawler after the response (Blocked Bots and Crawler
traffic widgets); see
[blocked-traffic-analytics.md](/docs/blocked-traffic-analytics.md).

Records contain no full IP (only `client_net`, the /16 or /48), no referer or
origin path or query, no query values, cookies or credentials. Paths never
include the query string.

### Bot report and alert

The PrometheusRule `NorseTenantSearchBurst` (charts) fires on a per-tenant
burst on norse-api. Then run `charts/tools/bot-report` (port-forward only; see
its README) or open the Grafana dashboard "Bot traffic / Arcjet":

1. **Missed** (mostly ALLOW): send the Slack report with the `req_` IDs to
   Arcjet. If urgent, write a `DRY_RUN` filter from the top feature, then
   switch it to `LIVE`.
2. **Served-denied** (mostly DENIED_NOT_ENFORCED): consider adding the host to
   `ARCJET_ENFORCED_HOSTS`, after checking the share of returning clients in
   the enforcement report.
3. **Saturated** (many ERROR): a capacity problem.
4. **One request:** click a log row → `trace_id` → its cost in Tempo. The same
   `trace_id` is the `correlationId` on Arcjet's record.

### Open questions for Arcjet

1. Does the dashboard show and search `correlationId` and `metadata`? How long
   are they kept?
2. Is sending `tenant_id` and `client_signature` in `metadata` acceptable? Any
   limits on our plan?
3. How do custom rate-limit characteristics work from `protect()` props (the
   per-visitor print limit)?
4. ~~Exact field names for hosting / VPN in filter expressions.~~ Answered
   2026-11-18: `ip.src.hosting`, `ip.src.crawler`, `ip.src.relay` (see
   `HOSTING_IP_FILTER`).
5. Data-retention and data-sent options for Advanced Signals.
6. Do `lreq_` decisions (timeouts or local cache) reach Arcjet at all?

### Privacy (needs sign-off before merge)

- **Newly logged:** allowlisted header values and all header names; referer
  and origin host and shape flags; query key names; the /16 (/48) network;
  optionally `client_ip_hash` (only with `ARCJET_LOG_IP_HASH_KEY`).
- **Newly sent to Arcjet:** path (no query) and method, `correlationId` (trace
  ID), `metadata` (`tenant_id`, `route`, `deployment`, `client_signature`).
- **No longer sent to Arcjet:** our response headers, every cookie except
  `aj_signals`.
- **Still never logged or sent:** the full IP in our logs, the referer path or
  query, query values, cookies, `authorization`, API keys.

## Crawl trap: `amp;` keys (ISS-2307)

An outside crawler reads React's correctly escaped `href="…&amp;page=2"`
without decoding the entity and requests `?…&amp;page=2`, so the key arrives
as `amp;page`. Pagination used to copy every key and replace only `page`, so
each hop added a level (`amp;amp;page`, …): 944 URLs up to 35 levels deep in
the 2026-07 to 2026-10 harvest, 87% of them on Maryland (ISS-2379). Every hit
ran a full search against Norse-API. No Norse writer emits such a key and no
reader recognises one.

| Layer | Where | What |
| --- | --- | --- |
| Edge | `src/middlewares/crawlTrapMiddleware.ts`, first in `src/proxy.ts` after the role gate | `410 Gone` (`X-Robots-Tag: noindex`) for any page route the proxy matches (not `/api`, `/admin`, static files, `robots.txt` or `sitemap.xml`) whose query has a key starting with `amp;` (any case, also percent-encoded), on every tenant, before the tenant lookup: no CMS call, no search, no Arcjet decision. The body is a tiny HTML page with a `nofollow` link to the same URL without the broken keys, so a person who followed a mangled link can continue. |
| Writers | `currentSearchString` (pagination, language switch, and `stringifySearchParams` from `useClientSearchParams`), `sortHref` (sort), `rewriteSearchUrl` (filter navigation, coords redirect) | Drop `amp;` keys when copying the current URL, so a copied URL is never deeper than its source. |
| robots.txt | `src/app/robotsRules.ts`, `User-agent: *` | `Disallow: /*?amp;`, `/*&amp;` (and upper case). Matches a key only: a real `&` or `;` inside a value is percent-encoded. Mixed-case or percent-encoded keys are not covered here; the edge 410 catches them. |

The key test is `isCrawlTrapKey` in `src/lib/crawl-trap.ts`; all three layers
use it. Values are never inspected.

**Paid ads are unaffected.** Watt Advertising's landing URLs
(`/search?query=…&query_label=…&query_type=taxonomy&entry=topic_card&location=…&coords=…`,
plus `gclid`/`gad_*`) carry no `amp;` key, and AdsBot ignores `User-agent: *`
rules anyway. A test pins that shape as allowed at every layer.

**Only this shape is refused.** Every other odd URL shape in ISS-2379 was
decided "preserve" (2026-10-18) and is read by the search-intent lift. Removed
resources keep their 404; the id re-key redirects are ISS-2514 and ISS-2517.

The robots disallow list and Arcjet's bot rules are separate concerns: the
crawler list in `robotsRules.ts` (`DISALLOWED_CRAWLERS`) must still agree with
`ARCJET_ALLOWED_BOTS`; the trap patterns apply to every crawler and need no
Arcjet counterpart, since the edge 410 comes first.

## Rollout procedure

1. Deploy with `ARCJET_ENFORCED_HOSTS` unset. Every host is observe-only.
2. Do the staging checks in ISS-2423.
3. Read the `arcjet_decision` records and the Arcjet console for 2 to 3 days.
4. Set `ARCJET_ENFORCED_HOSTS` to one agreed host. Watch `arcjet_decision`
   records with `enforced=true` on it for some days.
5. Set `ARCJET_UNENFORCED_HOSTS=mboa.c211.io` on both production apps.
6. Set `ARCJET_ENFORCED_HOSTS=*`. New tenants are then enforced from their
   first request; read its `arcjet_decision` denials in its first week.
7. Remove `mboa.c211.io` from `ARCJET_UNENFORCED_HOSTS` only after MNIT
   replies (ISS-1737).

## Recovery runbook

Anyone with access to the DigitalOcean App Platform apps can do these. Each
takes effect after the redeploy, a few minutes.

| Situation | Action |
| --- | --- |
| Real people are blocked on one host | Add that host to `ARCJET_UNENFORCED_HOSTS`. |
| Real people are blocked everywhere | Set `ARCJET_ENFORCED_HOSTS` to empty. Arcjet keeps logging. |
| Arcjet is slow or down | Nothing on observe-only hosts (the decision runs after the response). Enforced hosts fail open after `ARCJET_TIMEOUT_MS`, so each page view can wait that long. To stop calling it at all, unset `ARCJET_KEY`. |
| A bot we need is denied | Add its Arcjet label to `ARCJET_ALLOWED_BOTS` (code change and deploy). Meanwhile, unenforce the affected host. |

Until the redeploy finishes, blocked people see the 403 page. Read the
`arcjet_decision` records (`denied_bots`, `reason_type`, `decision_id`) to find which rule or bot
label caused it.

## Tests

- Unit: `tests/arcjet.test.ts` (rules, enforcement, client IP);
  `tests/arcjet-decision-observability.test.ts` (request sent to Arcjet,
  including an SDK-level check of path/method/`query === ""`, proxy
  `x-norse-*` overwrite, CSP sources, referer shape, client signature,
  sampling and burst mode, the `arcjet_decision` record, the SDK log adapter);
  `tests/arcjet-timing.test.ts`; `tests/telemetry-arcjet-search.test.ts`
  (metric labels);
  `tests/crawl-trap.test.ts` (edge 410, writers, robots patterns).
- E2E runs in CI against the dev hosts only, which stay unenforced. It does
  not run against production, where headless Chromium is expected to be
  denied.
- No automated check covers the real `403` from `forbidden()`. Check it on
  staging (ISS-2423): a browser user agent gets `200`, `curl` gets `403`.
