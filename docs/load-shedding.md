# Load shedding: per-tenant load limits

Bot bursts hit one tenant's site at a time: 150–630 requests a minute for
2–3 minutes, from a residential proxy that changes IP every few seconds and
looks like Chrome. Every request is a full server render, so a burst
saturates the 1-vCPU app instances and slows every tenant on them. Bot
protection can't recognise these clients, and a per-IP limit can't stop
them, but a limit **per tenant** stops a burst whoever sends it, and other
tenants keep working normally.

Two limits, both enforced from the moment they are deployed (no observe
mode). Above either one, the request gets a **429** and a small branded
"busy" page instead of a render.

| Limit | Default | Where | Counted |
| --- | --- | --- | --- |
| Requests in flight per tenant | 20 per instance | HTTP-level hook (`src/lib/load-shed/http-hook.ts`) | in memory, per instance |
| Requests per tenant per minute | 600 across all instances | proxy (`src/lib/load-shed/minute-limit.ts`) | Redis, fixed calendar minute |

During the November bursts the concurrency limit absorbs the typical burst
(150–420 a minute); the per-minute limit only triggers for the largest
(551–631 a minute). 20 page builds at once still load a 1-CPU instance, so
several tenants bursting together can still slow it.

## Where it is configured

Environment only, per deployment (tied to server capacity, not to a
tenant's content):

| Variable | Default | `0` |
| --- | --- | --- |
| `LOAD_SHED_MAX_CONCURRENT_PER_TENANT` | `20` | turns the concurrency limit off |
| `LOAD_SHED_MAX_PER_MINUTE_PER_TENANT` | `600` | turns the per-minute limit off |

Setting a variable to `0` in the DigitalOcean dashboard is the emergency
off switch; it takes effect on the next deploy/restart. An invalid value
falls back to the default.

## Which requests are limited

`GET`/`HEAD` of the pages that build a full directory render, with or
without a locale prefix, and the custom base path stripped:

- `/search`, `/search/[id]`, `/details/original/[id]`
- the same paths as RSC navigations and prefetches (`?_rsc=`, `rsc: 1`)
- `/api/search-pins`: **concurrency limit only** (the proxy matcher skips
  `/api`, so the per-minute limit never sees it)

Everything else (home, topics, static assets, other API routes, server
actions) is not limited. Matching: `loadShedRouteOf` in
`src/lib/load-shed/config.ts`.

## Architecture

```
request ──▶ http.Server 'request' event
            │  installLoadShedHook (from register(), app/all roles only)
            │  key = tenant id from the registry, else "host:<host>"
            │  in flight ≥ 20? ──yes──▶ 429 busy page (Next.js never sees it)
            │  take a slot, release on res 'close'
            ▼
          Next.js ──▶ proxy.ts
            │  tenant basic config (CMS) → tenantId, name
            │  rememberTenant(host, …)
            │  limited page? INCR+EXPIRE loadshed:<tenantId>:<minute> (one MULTI)
            │  count > 600 ──yes──▶ 429 busy page
            ▼
          page render (Arcjet, data, …)
```

Why two places:

- **Concurrency needs to know when a response is finished.** Only the HTTP
  server sees that, for every ending (normal, error, client gone). The
  proxy runs before the render and can't; releasing a slot from the page's
  `after()` would leak slots on redirects and crashes. The hook wraps
  `http.Server.prototype.emit` once per process, installed from
  `register()` in `src/instrumentation.ts` (Node runtime, `NORSE_ROLE`
  `app` or `all`). It has no dependencies and does a Map lookup per request.
- **The per-minute limit needs the tenant, Redis and a 429.** The proxy has
  all three: it already resolves the tenant per host (`getTenantBasicConfig`
  now returns `tenantId` and `name`), the proxy runs in Node in Next 16, and
  it can return any status. Pages can't return a 429 (only 401/403/404).

### Tenant registry

`src/lib/load-shed/tenant-registry.ts`: host → `{ tenantId, name, logoUrl,
primaryColor }` on `globalThis`, shared by the proxy, pages and the hook
(all in one Node process). The proxy fills `tenantId`/`name`; the app config
(`getCachedAppConfig`) fills the branding. Until a host has been seen once
after a restart, the hook keys it by host and the busy page is generic.

### Redis counter

- Key `loadshed:<tenantId>:<epochMinute>`, `INCR` and `EXPIRE 70` in one
  `MULTI` (`cacheService.incrementInWindow`).
- **Fails open**: no Redis, an error or an answer slower than 50 ms
  (`LOAD_SHED_REDIS_TIMEOUT_MS`) lets the request through.
- Once a tenant is over its limit, the instance remembers it until the
  minute ends and stops asking Redis, so a burst costs one Redis call per
  instance per minute after the limit.

### The 429

- Full page loads: a static HTML page built as a string
  (`src/lib/load-shed/busy-page.ts`): tenant logo and name, "We're busy right
  now", and a **Refresh** link to the same URL (works without JavaScript).
  Generic when the tenant isn't known yet. No React render, no data fetch.
- RSC navigations and `/api/search-pins`: plain text.
- Headers: `Retry-After: 30`, `Cache-Control: no-store`,
  `X-Robots-Tag: noindex`. Served directly, never a redirect: a redirect
  costs a second request and would put the search query into another URL.

## Visibility

- Metrics (see [observability.md](/docs/observability.md)):
  `norse_load_shed_total{limit, tenant}` and the gauge
  `norse_load_shed_in_flight{tenant}`.
- Logs: one `load_shed` warn per tenant per limit per minute, with
  `shedSinceLastLog` (not one line per request).

## Limits and known gaps

- No "people first" lane yet: during a burst, people on the same tenant get
  the busy page too, for the minute or seconds the burst lasts. Planned as a
  follow-up (signed visitor cookie with reserved slots).
- No exemption for search engines: neither the hook nor the proxy can verify
  Googlebot without Arcjet. A verified crawler hitting a busy page sees a
  429 with `Retry-After`, which search engines treat as temporary.
- The busy page is in English only.

## Tests

`tests/load-shed.test.ts`: route matching and env parsing, both limiters
(including fail-open on a slow or failing Redis), the registry, the busy
page (escaping, unsafe logo URLs and colours) and the HTTP handler
(slot release on `close`, plain-text 429 for RSC and the pins API).
