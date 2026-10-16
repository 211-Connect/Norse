# Blocked traffic analytics (ISS-2366)

Requests Arcjet denies in `src/proxy.ts` answer 403 before any page loads,
so the client-side Umami script never runs for them and the Payload
analytics dashboard could not show them. This feature counts them
server-side as a `bot_blocked` Umami event and shows the count, by
classification, in a **Blocked Bots** dashboard widget. Blocked requests
are **not** in Page Views or any other widget.

## Where it is configured

- Per tenant: Payload **Tenants → Analytics Settings** — `Main website`
  (`analytics.umamiWebsiteId`) and `API Key` (`analytics.apiKey`). Both must
  be set for the tenant's blocked traffic to reach its own Umami website.
- Platform fallback (env, all three or none):
  `ARCJET_BLOCKED_EVENTS_FALLBACK_WEBSITE_ID`,
  `ARCJET_BLOCKED_EVENTS_FALLBACK_TENANT_ID`,
  `ARCJET_BLOCKED_EVENTS_FALLBACK_ANALYTICS_API_KEY`. Used when the host
  matches no tenant or the tenant lacks a website id / analytics key.
  Unset: those events are dropped and counted in
  `blocked_traffic_event_dropped` logs (`reason`, `droppedTotal`).
- `API_URL` (Norse API). Unset: the sender is disabled with one
  `blocked_traffic_sender_disabled` warn per Edge instance.

## Architecture

```
proxy (Edge)                          Norse-API                 Umami
──────────────────────────────────    ─────────────────────     ──────────
arcjetProtect → DENY / DENIED_NOT_ENFORCED
  │ 403 goes out immediately (DENY)
  └ waitUntil(recordBlockedTraffic)
      ├ loadTenantConfig(host)   ← cached per host (10 min)
      ├ resolveBlockedTrafficTarget → tenant | fallback | drop
      ├ classifyBlockedTraffic  (src/lib/arcjet-classification.ts)
      └ sender.enqueue(target, SendEventDto)
          batch per tenant, flush at 50 or 5 s, ≤100/request
          POST /analytics/events/batch ─────▶ AnalyticsApiKeyGuard
             x-tenant-id, x-analytics-api-key   (per tenant) ──▶ POST /api/send
                                                                 type: event
```

Files:

| File | Role |
| --- | --- |
| `src/lib/arcjet-classification.ts` | `classifyBlockedTraffic` — the seo / nefarious / unknown rules (table in [architecture.md](/docs/architecture.md#blocked-traffic-analytics-iss-2366)) over `@arcjet/protocol`'s own category map. |
| `src/lib/blocked-traffic-events.ts` | `buildBlockedTrafficEvent` (the `SendEventDto` shape), `resolveBlockedTrafficTarget` (tenant → fallback → drop), `createBlockedTrafficSender` (per-instance batcher; never throws). |
| `src/proxy.ts` | `recordBlockedTraffic`, handed to `NextFetchEvent.waitUntil` so it never delays the response. `loadTenantConfig` is the per-host cached fetch the main flow also uses. |
| `src/app/(payload)/api/getTenantBasicConfig/route.ts` | `TenantBasicConfigResponse.tenantId` + `analytics.{umamiWebsiteId, apiKey}` so the Edge proxy can attribute without reading app config. |
| `src/payload/components/analytics/widgets/BlockedBotsWidget.tsx` | The dashboard widget (`WidgetSlug.BlockedBots`), reading `event-values` for `bot_blocked` / `classification`. |

### The event

Name `bot_blocked`; `data`:

| Key | Values |
| --- | --- |
| `classification` | `seo` \| `nefarious` \| `unknown` |
| `bot` | first denied Arcjet bot label, or `''` |
| `category` | the Arcjet category that decided the classification, or `''` |
| `reason` | `bot` \| `filter` \| other `decision.reason.type`, lower-cased |
| `source` | `proxy` (reserved: `fingerprint-cache`, `filter-rule`) |
| `enforced` | `true` for a DENY; `false` for an observe-only host (`ARCJET_ENFORCEMENT_EXCLUDED_HOSTS`), so MBOA's denials are counted too |
| `host` | request host (port stripped) |
| `path` | request pathname (no query string) |

### Why it does not inflate human metrics

Norse-API forwards each event to Umami `/api/send` with `type: 'event'` and
a `name`, which Umami stores as a custom event (`event_type = 2`), not a
pageview (`event_type = 1`), so Page Views and the pageview chart are
untouched. Umami derives the session from the sending IP and User-Agent;
Norse-API posts with its own egress IP and a fixed User-Agent
(`umami.userAgent`), so in Umami these events belong to **one synthetic
visitor per Norse-API instance** (or per egress IP). Expect that visitor in
"Total Users" style counts if Umami attributes sessions with events to
visitors; it is a constant, not proportional to blocked traffic.

### Guarantees and limits

- Never delays or fails the 403: all work is behind `waitUntil` and every
  path catches.
- Per-tenant authentication is the reason the batcher groups by tenant; a
  batch is one tenant's credentials and only that tenant's website id.
- No retry: a rejected or failed batch is logged
  (`blocked_traffic_batch_rejected` / `_failed`) and dropped.
- Queue cap `BLOCKED_TRAFFIC_MAX_QUEUED` (1000) per instance; beyond it new
  events are dropped with a counter.
- On an observe-only host the deny path and the main flow may both fetch
  the tenant config once on a cold cache; afterwards both hit the cache.
