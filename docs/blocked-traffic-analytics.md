# Crawler and blocked traffic analytics (ISS-2366)

Requests that Arcjet denies in `protectPage` (`src/lib/arcjet-page.ts`) get a
403 from `forbidden.tsx`, which renders no `PageWrapper`, so the Umami script
never runs for them. Most crawlers run no JavaScript anyway (curl, scrapers,
AI crawlers, search engines), so Umami never sees them. Norse counts them on
the server instead, **per crawler and per outcome**, and shows them in two
Payload analytics dashboard widgets:

- **Blocked Bots**: a stat card, "M requests were blocked
  bots". Counts blocked and rate-limited requests (both got a 403).
- **Crawler traffic**: a chart of the selected tenant's counted requests per
  hour or per day, stacked by outcome, and a table of the top crawlers.

Neither widget is in the default layout (`ANALYTICS_DEFAULT_LAYOUT` in
`src/payload/components/analytics/widgetInfo.ts`): a user adds them by
editing the dashboard layout, and they then stay in that user's saved
layout. Users whose layout was saved while Blocked Bots was a default keep
it until they remove it or reset the layout.

Counted requests are **not** in Page Views or any other Umami widget.

## What is counted

Each request is counted once, under one crawler name (Arcjet's bot name,
e.g. `AHREFS_CRAWLER`) and one outcome:

| Outcome | When | Crawler name |
| --- | --- | --- |
| `blocked` | Arcjet denied it on an enforced host (403) | first denied bot |
| `rate_limited` | Arcjet's per-IP rate limit denied it on an enforced host (403) | usually none |
| `logged` | Arcjet denied it on an observe-only host (not in `ARCJET_ENFORCED_HOSTS`, or in `ARCJET_UNENFORCED_HOSTS`, e.g. MBOA); the page was served | first denied bot |
| `allowed` | Arcjet allowed it and identified it as an allowed crawler (Googlebot, Bingbot, link previews, monitors, AI assistants) | first allowed bot |
| `shed` | a per-tenant load limit answered 429 ([load-shedding.md](/docs/load-shedding.md)) | none (counted before Arcjet runs) |

Not counted:

- people;
- unidentified clients that Arcjet allowed. The November burst bot was one
  of these.

A request that carries several crawler names (e.g. Meta's
`META_WEBINDEXER` + `FACEBOOK_CRAWLER`) is still counted once, so totals
are not inflated. Each count also carries the crawler's `classification`
(`seo` | `nefarious` | `unknown`).

Code: `crawlerTrafficOf` in `src/lib/crawler-traffic.ts`.

## Why counters, not one event per request

<<<<<<< HEAD
About 30 requests/s reach Norse and more than half are bots. One analytics
event per denial would be ~15 writes/s (about 10 Umami rows each, with event
data) into the database that serves the tenants' real analytics. Instead,
each server instance increments an in-memory counter and pushes the deltas
once a minute: about `instances × active tenants` small requests per
minute, whatever the bot volume. Per-request detail (bot name, path) is
already in the `arcjet_decision` records and the Arcjet console (`decision_id`).
=======
About 30 requests/s reach Norse, and more than half are bots. One analytics
event per request would be about 15 writes/s into the database that serves
the tenants' real analytics. Instead, each server instance increments an
in-memory counter and pushes the deltas once a minute. That is about
`instances × active tenants` small requests per minute, whatever the bot
volume. Per-request detail (path, decision) is already in the
`arcjet_denied` logs and the Arcjet console (`decisionId`).
>>>>>>> origin/development

## Where it is configured

- Nothing per tenant.
- A count is attributed to a tenant by host, with `getTenantByHost`
  (`@/lib/cms`) (`trustedDomains`). A load-limit 429 uses the tenant id
  the proxy resolved.
- A request on a host that matches no tenant is counted for the shared
  "unknown" tenant `UNKNOWN_TENANT_ID`
  (`00000000-0000-0000-0000-000000000000`). Its pushes carry only the
  internal key: it has no Payload document and no Norse API key.
- `INTERNAL_API_KEY` and `API_URL`: the push uses Norse-API's internal
  endpoint with the tenant's usual headers (`getInternalHeaders`).

## Architecture

```
protectPage (page, Node)                         Norse-API                       MongoDB
───────────────────────────────────────────      ───────────────────────────     ─────────────────────────
arcjetProtect → DENY / DENIED_NOT_ENFORCED / ALLOW with allowedBots
  └ after(recordArcjetTraffic)
      ├ crawlerTrafficOf → crawler, outcome, classification
      ├ getTenantByHost(host)   ← cached per host
      └ counter.record(...)     Map increment, current UTC hour
load-limit 429 (HTTP hook / proxy)
  └ reportLoadShed → counter.record(outcome: shed)

every 60 s per instance (and best effort on SIGTERM):
  counter.flush → POST per tenant (≤ 1000 buckets) ─▶ POST /internal/crawler-traffic
     { buckets: [{ hour, crawler, outcome,             InternalApiGuard, x-tenant-id
                   classification, count }] }          bulkWrite $inc upsert ──────▶ crawler_traffic_hourly
Payload dashboard
  BlockedBotsWidget    → /api/analytics/blocked-traffic   → GET /analytics/blocked-traffic
                                                             (old blocked_traffic_hourly + new collection)
  CrawlerTrafficWidget → /api/analytics/crawler-traffic   → GET /analytics/crawler-traffic?granularity=hour|day
```

Files:

| File | Role |
| --- | --- |
| `src/lib/arcjet-page.ts` | Schedules `recordArcjetTraffic` with `after()` inside the cached `decide`. A page and its `generateMetadata` record one count per request, and the count never delays the response. |
| `src/lib/arcjet/index.ts` | Adds `allowedBots` to an `ALLOW` result: the identified crawlers Arcjet let through. |
| `src/lib/crawler-traffic.ts` | `crawlerTrafficOf` (decision → crawler, outcome, classification), `recordArcjetTraffic` (tenant by host) and `recordCrawlerTraffic`. Owns the per-process counter (on `globalThis`) and its push through the generated `crawlerTrafficInternalApiClient` (10 s timeout). Never throws. |
| `src/lib/crawler-traffic-counter.ts` | `createCrawlerTrafficCounter`: the in-memory buckets and the 60 s flush timer (started on the first count, `unref`'d). Requeues on failure, splits pushes at 1,000 buckets, and keeps at most 20,000 pending buckets. Pure; unit-tested in `tests/crawler-traffic-counter.test.ts`. |
| `src/lib/arcjet-classification.ts` | `classifyBlockedTraffic` / `classifyBot`: the classification rules, as a table in [architecture.md](/docs/architecture.md#blocked-traffic-analytics-iss-2366). |
| `src/lib/load-shed/report.ts` | Counts every load-limit 429 as `shed`. |
| `src/payload/endpoints/analyticsProxy.ts` | Proxies `/analytics/blocked-traffic` and `/analytics/crawler-traffic` with the tenant analytics key, like every widget (website selection does not apply). |
| `src/payload/components/analytics/widgets/BlockedBotsWidget.tsx` | Stat card: blocked plus rate-limited requests. Observe-only denials are left out, because those requests were served. No trend: the endpoint has no previous-period comparison. |
| `src/payload/components/analytics/widgets/CrawlerTrafficWidget.tsx` | Chart by outcome, hourly or daily (hourly only for ranges up to 31 days), and the top 15 crawlers. |

Norse-API side (storage, endpoints, validation): `docs/crawler-traffic.md`
in the Norse-API repo.

## Guarantees and limits

- Never delays or fails a response:
  - all work runs behind `after()`, or after the 429 is written;
  - the request path only does a Map increment;
  - every path catches its errors.
- Counts are best effort, not exact:
  - A failed push (`crawler_traffic_push_failed`) is added back and sent
    with the next flush. Buckets older than 24 h are dropped instead.
  - A push that times out after Norse-API applied it is counted twice.
  - Up to one minute per instance is lost on a crash. On SIGTERM the
    instance tries one last push, which may not finish before exit.
- Hourly resolution: the widget's range is rounded out to whole UTC hours.
- Retention: Norse-API keeps the hourly buckets indefinitely, with no TTL.
- Deprecated: Norse-API's `POST /internal/blocked-traffic` and its
  `BlockedTrafficInternal` client are no longer called by Norse. They stay
  until every deployment runs the per-crawler counters.
- Older history:
  - Counts from before the per-crawler counters stay in Norse-API's
    `blocked_traffic_hourly`, which is no longer written.
  - They still feed the Blocked Bots card.
  - The Crawler traffic widget starts empty at the switch.
- Only routes that call `protectPage` are counted (list in
  [bot-protection.md](/docs/bot-protection.md)). For `shed`, only the
  routes in [load-shedding.md](/docs/load-shedding.md) are counted.
