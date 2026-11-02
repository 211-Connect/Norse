# Blocked traffic analytics (ISS-2366)

Requests that Arcjet denies in `protectPage` (`src/lib/arcjet-page.ts`) get a
403 from `forbidden.tsx`, which renders no `PageWrapper`, so the Umami script
never runs for them. Most of them are clients that run no JavaScript anyway
(curl, scrapers, AI crawlers), so Umami never saw them. This feature counts
them on the server and shows the count in a **Blocked
Bots** widget in the Payload analytics dashboard, next to Page Views. A
tenant sees "N page views, and M requests were blocked bots" instead of an
unexplained change. Blocked requests are **not** in Page Views or any other
widget.

## Why counters, not one event per request

About 30 requests/s reach Norse and more than half are bots. One analytics
event per denial would be ~15 writes/s (about 10 Umami rows each, with event
data) into the database that serves the tenants' real analytics. Instead,
each server instance increments an in-memory counter and pushes the deltas
once a minute: about `instances × active tenants` small requests per
minute, whatever the bot volume. Per-request detail (bot name, path) is
already in the `arcjet_denied` logs and the Arcjet console (`decisionId`).

## Where it is configured

- Nothing per tenant. A tenant's denials are attributed by host with
  `findTenantByHost` (`trustedDomains`), like the rest of the app. A denial
  on a host that matches no tenant is counted for the shared "unknown"
  tenant `UNKNOWN_TENANT_ID` (`00000000-0000-0000-0000-000000000000`),
  pushed with the internal key only (it has no Payload document or Norse
  API key). The page only renders for a host the proxy resolved to a
  tenant, so this is not expected; if it happens (e.g. a domain missing
  from `trustedDomains`), it shows up in Norse-API's
  `blocked_traffic_hourly` for that tenant id instead of being lost.
- `INTERNAL_API_KEY` and `API_URL`: the push uses Norse-API's internal
  endpoint with the tenant's usual headers (`getInternalHeaders`). Already
  required by scheduled PDF delivery.

## Architecture

```
protectPage (page, Node)                       Norse-API                     MongoDB
─────────────────────────────────────────      ─────────────────────────     ───────────────────────
arcjetProtect → DENY / DENIED_NOT_ENFORCED
  ├ after(recordBlockedTraffic)  registered before forbidden()
  │ forbidden() → 403 (DENY only)
  └ recordBlockedTraffic, after the response
      ├ findTenantByHost(host)  ← cached per host
      ├ classifyBlockedTraffic → seo | nefarious | unknown
      └ counter.record(tenant, class, enforced)   Map increment, current UTC hour

every 60 s per instance (and best effort on SIGTERM):
  counter.flush → one POST per tenant ─────────▶ POST /internal/blocked-traffic
     { buckets: [{ hour, classification,          InternalApiGuard, x-tenant-id
                   enforced, count }] }           bulkWrite $inc upsert ───────▶ blocked_traffic_hourly
                                                                                 (tenant, hour, class, enforced)
Payload dashboard
  BlockedBotsWidget → /api/analytics/blocked-traffic (analyticsProxy)
                   → GET /analytics/blocked-traffic?start&end ◀───────────────── hourly rows, totals
```

Files:

| File | Role |
| --- | --- |
| `src/lib/arcjet-page.ts` | Schedules `recordBlockedTraffic` with `after()` inside the cached `decide`, so a page and its `generateMetadata` record one count per request, and the count never delays the 403. |
| `src/lib/blocked-traffic.ts` | `recordBlockedTraffic`: tenant by host, classification, `counter.record`. Owns the per-process counter (on `globalThis`) and its push through the generated `blockedTrafficInternalApiClient` (10 s timeout). Never throws. |
| `src/lib/blocked-traffic-counter.ts` | `createBlockedTrafficCounter`: the in-memory buckets, the 60 s flush timer (started on the first denial, `unref`'d), requeue on failure. Pure, unit-tested in `tests/blocked-traffic-counter.test.ts`. |
| `src/lib/arcjet-classification.ts` | `classifyBlockedTraffic` — the rules, as a table in [architecture.md](/docs/architecture.md#blocked-traffic-analytics-iss-2366). |
| `src/payload/endpoints/analyticsProxy.ts` | `/analytics/blocked-traffic` proxy (tenant analytics key, like every widget; website selection does not apply). |
| `src/payload/components/analytics/widgets/BlockedBotsWidget.tsx` | The widget (`WidgetSlug.BlockedBots`): a stat card, like Page Views, showing blocked requests. Observe-only denials are not counted, because those requests were served. No trend: the endpoint has no previous-period comparison. |

Norse-API side (storage, endpoints, validation): `docs/blocked-traffic.md`
in the Norse-API repo.

### What a bucket counts

| Key | Values |
| --- | --- |
| tenant | from the request host (`findTenantByHost`); `UNKNOWN_TENANT_ID` when no tenant matches |
| `hour` | start of the UTC hour the denial happened in |
| `classification` | `seo` \| `nefarious` \| `unknown` |
| `enforced` | `true` for a DENY (403); `false` for an observe-only host (not in `ARCJET_ENFORCED_HOSTS`, or in `ARCJET_UNENFORCED_HOSTS`, e.g. MBOA), so those denials are counted too, separately |

## Guarantees and limits

- Never delays or fails the 403: all work is behind `after()`, the request
  path only does a Map increment, and every path catches.
- Counts are best effort, not exact:
  - A failed push (`blocked_traffic_push_failed`) is added back and sent
    with the next flush. Buckets older than 24 h are dropped instead.
  - A push that times out after Norse-API applied it is counted twice.
  - Up to one minute per instance is lost on a crash; on SIGTERM the
    instance tries one last push, which may not finish before exit.
- Hourly resolution: the widget's range is rounded out to whole UTC hours.
- Retention: Norse-API keeps buckets for 2 years (TTL index), so seasons
  can be compared year over year.
- Only routes that call `protectPage` are counted (list in
  [bot-protection.md](/docs/bot-protection.md)).
