# Plan: split Norse into a CMS app and a public app

Status: proposal (2026-10-30). Not implemented.

## Goal

Run Norse as two DigitalOcean apps built from one repository:

| App     | Serves                                                                                   | Has access to                                          |
| ------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **cms** | Payload admin (`/admin`), Payload REST (`/api/[...slug]`), a new internal API, Payload jobs, migrations | Postgres (`DATABASE_URI`), S3, SendGrid, Keycloak admin, Redis |
| **app** | Public directory pages, search, auth (Auth.js/Keycloak), share links, printable directories UI | Norse API, the CMS internal API, Redis (cache only — see open question 1) |

The **app** never opens a database connection and never initializes Payload.
Everything it reads from Payload today, it gets from the CMS over HTTP.

## The role switch

One env var, read at runtime:

```
NORSE_ROLE=app | cms | all     # default: all
```

- `all` is today's single-process behaviour. It stays the default, so local
  dev, e2e and the current production deploy keep working while the split is
  built.
- One Docker image, deployed twice with a different `NORSE_ROLE`. Payload 3
  runs inside Next.js, so the CMS is a Next.js app too; separate builds are
  an optional last phase (bundle size), not a requirement.

What the role controls:

1. **Routing gate** (`src/proxy.ts`). Both roles run the full image; the
   gate only decides what answers.
   - `app` answers `404` for `/admin`, Payload's `/api/[...slug]` and
     `/api/internal/*` (except the routes the app itself owns).
   - `cms` answers `404` for every public `(app)` page and the app's own API
     routes (`/api/auth`, `/api/share`, …). It keeps `/admin`,
     `/api/[...slug]`, `/api/internal/*`, `/api/tenants/[tenantId]/config`
     and the PDF render route.
   - Today's matcher skips `/admin` and `/api`, so the gate needs its own
     matcher entries.
2. **Payload guard** (`src/payload/getPayloadSingleton.ts`). In `app` it
   throws (phase 4) or logs `payload_used_in_app_role` with a stack (phase 0),
   so every remaining DB path shows up in production logs before it is cut.
3. **Jobs and migrations.** `jobs.autoRun` (translation, cache queues) and
   `payload migrate` run only in `cms`/`all`. Today `autoRun` starts in
   whichever process first initializes Payload.
4. **Lint guard.** ESLint `no-restricted-imports` in `src/app/(app)/**`,
   `src/lib/**`: forbid `@/payload/getPayloadSingleton`,
   `@payload-config`, `@/payload/collections/*/actions*`, `@/payload/services/*`.
   Type-only imports (`@/payload/payload-types`) and pure modules
   (`@/payload/i18n/locales`) stay allowed.

## What the app reads from Payload today

Found by grepping the code outside `src/payload/`. Each row becomes a CMS
internal endpoint or moves to the CMS.

| # | Read                                    | Call sites                                                                                                                                                                       | Replacement                                                                                                           |
| - | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1 | Tenant by host (`findTenantByHost`)     | `getServerSession`, `api/auth/[...nextauth]`, `share/[shortCode]` page, `favorites/[id]` page, `robots.ts`, `lib/blocked-traffic.ts`, `getTenantBasicConfig`                  | `GET /api/internal/tenants/by-host?host=`                                                                              |
| 2 | Tenant by id (`findTenantById`)         | `api/share/[tenantId]`                                                                                                                                                           | `GET /api/internal/tenants/:id`                                                                                        |
| 3 | `AppConfig` by host                     | `shared/utils/appConfig.ts` (every page render)                                                                                                                                  | `GET /api/internal/app-config?host=&locale=` returns the built, request-independent `CachedAppConfig`; the app adds `baseUrl` and `sessionId` |
| 4 | ResourceDirectory by tenant id          | `api/search-config/[tenantId]/[locale]` (public, CORS `*`, used by the widget)                                                                                                    | route stays on the app; reads `GET /api/internal/app-config?tenantId=&locale=` (search settings are part of `AppConfig`) |
| 5 | Tenant Norse API key                    | `lib/api/getTenantApiKey.ts` (every Norse API call)                                                                                                                              | field of #1/#2, internal endpoint only                                                                                 |
| 6 | Keycloak domain check                   | `api/keycloak/domain-check`                                                                                                                                                      | move the route to the CMS (it is called by Keycloak, not by users)                                                     |
| 7 | Health check                            | `api/healthz`                                                                                                                                                                    | app: liveness without Payload (don't fail the app when the CMS blips); cms: keeps the DB check                          |
| 8 | Printable directory image upload        | `serverActions/printableDirectories/uploadPrintableDirectoryImage.ts` (TenantMedia)                                                                                              | `POST /api/internal/tenant-media` (multipart), or upload straight to S3 with a CMS-signed URL                            |
| 9 | Auto-translation + usage metering       | `autoTranslatePrintableDirectoryText.ts`, `translation-usage/*` (TranslationUsage collections)                                                                                  | `POST /api/internal/translate` on the CMS: it translates, meters and enforces the monthly limit in one place            |
| 10| Scheduled PDF delivery                  | `services/scheduled-pdf-delivery/*`, `sendPrintableDirectoryDeliveryTest.ts`                                                                                                    | job code moves under `src/payload/` (it is a Payload job); "send test" calls a CMS endpoint. See "PDF rendering" below |
| 11| `getTenantBasicConfig` (proxy)          | `src/proxy.ts` → already HTTP via `PAYLOAD_CMS_URL`                                                                                                                              | move the route to `/api/internal/tenants/basic-config` with the others                                                 |
| 12| `/api/tenants/[tenantId]/config`        | external consumers; builds `AppConfig` with `getAppConfig`                                                                                                                       | stays on the **cms** only (it has the DB and the full code); the app does not serve it                                 |

Already HTTP and unaffected: favorites, share URLs, printable directory CRUD,
search, geocoding — they go to the Norse API through `src/lib/api/clients.ts`.

## CMS internal API

- Route group `src/app/(payload)/api/internal/**`, served only in `cms`/`all`.
- Auth: one header, `x-internal-api-key`, one secret. Fold
  `PAYLOAD_API_ROUTE_SECRET` and `PAYLOAD_APP_CONFIG_API_KEY` into a single
  `CMS_INTERNAL_API_KEY`, compared with `secretsMatch`.
- App-side client: `src/lib/cms/client.ts`, the only module that knows
  `PAYLOAD_CMS_URL`. Same rules as the Norse API SDK: no ad-hoc `fetch` in
  feature code, every call carries the tenant (host or id), fail fast without
  one.

| Endpoint                                              | Returns                                                                                                   | Replaces rows |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| `GET /api/internal/app-config?host=&locale=`          | `CachedAppConfig` built by today's `getCachedAppConfigBase` (moves to the CMS with its helpers)           | 3             |
| `GET /api/internal/app-config?tenantId=&locale=`      | same, looked up by tenant                                                                                 | 4             |
| `GET /api/internal/tenants/basic-config?host=`        | today's `TenantBasicConfigResponse` (locales, login wall, `noindex`) for the proxy                        | 11            |
| `GET /api/internal/tenants/by-host?host=`             | the tenant fields the app uses (id, name, realm, auth, SMS settings); `null` for an unknown host          | 1             |
| `GET /api/internal/tenants/:id`                       | same, by id                                                                                               | 2             |
| `GET /api/internal/tenants/:id/api-key`               | the tenant's Norse API key; never part of the other responses                                             | 5             |
| `POST /api/internal/tenant-media`                     | uploads a printable-directory image, returns its URL                                                      | 8             |
| `POST /api/internal/translate`                        | translates printable-directory text, meters usage, enforces the monthly limit                             | 9             |
| `POST /api/internal/printable-directory-deliveries/:id/test` | renders and emails a delivery to the signed-in user ("Send to me now")                             | 10            |

**AppConfig caching.** The app keeps the same Redis key,
`app_config:<host>:<locale>`: memory → Redis → CMS on a miss. The CMS's
`revalidateCache` hooks already delete that key on save, so invalidation works
unchanged; the pub/sub message clears app memory caches.

## Networking on DigitalOcean

Two separate apps cannot use App Platform's internal component networking, so
the app reaches the CMS on a public URL. **That URL must not sit behind the
Cloudflare WAF rules that produced today's 403s**, or every page render
inherits the same failure. Options, in order of preference:

1. `cms-internal.<domain>` as a DNS-only (grey cloud) record pointing at the
   CMS app's DO hostname, used only for server-to-server traffic.
2. A Cloudflare WAF skip rule for `/api/internal/*` carrying the internal key
   header.
3. DO VPC egress / private networking if your plan supports it.

The admin UI can stay on a normal Cloudflare-proxied hostname
(`cms.<domain>`); it is browser traffic.

## Caching and invalidation

Today Payload hooks (`revalidateCache` on Tenants and ResourceDirectories)
delete Redis keys (`tenant:*`, `resource_directory:*`, `app_config:*`) and the
**in-memory** cache — but only of the process that saved the document. After
the split that process is the CMS, so app instances keep stale memory entries
until TTL.

- App caches CMS responses with `withCache` (memory + Redis), same keys as now.
- Invalidation: the CMS hook publishes the host on a Redis pub/sub channel
  (`norse:cache-invalidate`); every app instance subscribes and clears its
  memory entries. Redis keys are still deleted directly.
- Serve stale on CMS failure: keep a long stale TTL in Redis so a CMS outage
  degrades to "config a few minutes old", not "no config". Without any
  config the proxy keeps today's fail-open behaviour (default locales, no
  login wall) — decided, see Decisions.

## PDF rendering

The scheduled-delivery job calls the Pages API render route
`src/pages/api/internal/printable-directory-pdf.ts`. The job runs in the
**cms**, and so does the render route: the cms runs the full image, and the
routing gate lets `/api/internal/*` through. The render route itself needs
only the Norse API, not Payload.

Loopback (`http://127.0.0.1:$PORT`, today's default) does not work on DO App
Platform, so set `INTERNAL_APP_URL` on the cms to its own server-to-server
hostname (`cms-internal.<domain>`, see Networking). The render route already
checks `INTERNAL_API_KEY`, so it is safe on a reachable hostname.

The app's "Send to me now" button calls a CMS endpoint, which renders and
emails through the same path.

## Environment per app

| Variable                                                          | app | cms |
| ----------------------------------------------------------------- | :-: | :-: |
| `NORSE_ROLE`                                                      | `app` | `cms` |
| `DATABASE_URI`, `DATABASE_POOL_*`                                 |     |  ✓  |
| `PAYLOAD_SECRET`                                                  |     |  ✓  |
| S3 / media storage                                                |     |  ✓  |
| `SENDGRID_API_KEY`, `KEYCLOAK_ADMIN_SECRET`, translation provider |     |  ✓  |
| `PAYLOAD_CMS_URL`                                                 |  ✓  |     |
| `INTERNAL_APP_URL` (render route)                                                 |     |  ✓  |
| `CMS_INTERNAL_API_KEY`                                            |  ✓  |  ✓  |
| `CACHE_REDIS_URI`                                                 |  ✓  |  ✓  |
| `API_URL`, `INTERNAL_API_KEY` (Norse API)                         |  ✓  |  ✓  |
| `NEXTAUTH_*`, `ARCJET_*`, Umami, map styles                       |  ✓  |     |

Removing `DATABASE_URI` from the app is the final proof that the split is
complete.

## Phases

Each phase ships on its own and leaves production working.

0. **Role switch, observe only.** Add `NORSE_ROLE` (default `all`), the
   routing gate and the Payload guard in log-only mode. Deploy a second DO app
   with `NORSE_ROLE=cms` from the same image (admin on `cms.<domain>`, jobs
   and migrations only there). The existing app keeps `all`.
1. **CMS internal API + client.** Endpoints for rows 1–5 and 11, the
   `src/lib/cms/client.ts` client, one internal key, the networking choice
   above. Contract tests against `all` locally.
2. **Move the hot reads.** Switch rows 1, 3, 5 (tenant by host, app config,
   API key) to the client with memory+Redis caching and pub/sub
   invalidation. Watch latency and `payload_used_in_app_role` logs.
3. **Move the rest.** Rows 2, 4, 6–10. Move job-only code
   (`scheduled-pdf-delivery`, `translation-usage`) under `src/payload/`.
4. **Cut the cord.** Switch the public app to `NORSE_ROLE=app`, guard
   throws, lint rule on, remove `DATABASE_URI`/`PAYLOAD_SECRET` from the app.
5. **Optional: separate builds.** Exclude `(payload)` and `src/payload/**`
   from the app bundle (smaller image, faster cold start).

## Decisions

Agreed 2026-10-30:

1. **Redis stays in the app** as a cache, never a source of truth. CMS hooks
   keep deleting Redis keys directly; app memory caches are cleared over Redis
   pub/sub.
2. **Nothing on the public app uses the Payload admin cookie**
   (`payload-token`). The admin moves to the CMS domain with no app-side
   changes.
3. **No fail-closed login wall.** If the config cannot be fetched, the proxy
   keeps today's behaviour. The goal is that the fetch never fails: CMS on a
   non-WAF hostname, Redis stale cache, alerting on
   `tenant_basic_config_fetch_failed`.
4. **`/api/tenants/[tenantId]/config` lives only in the CMS.** It is not
   merged into the internal API.
5. **The cms runs the whole image**, app routes included, and the routing
   gate answers `404` for public pages. That keeps the PDF render route and
   `getAppConfig` (used by #4) working there without a second build.

6. **The CMS returns the built `AppConfig`** (request-independent part). The
   assembly code (`getCachedAppConfigBase` and its helpers) moves to the CMS;
   the app only adds `baseUrl` and `sessionId` from the request.

## App endpoints after the split

What the public app (`NORSE_ROLE=app`) still serves under `/api`:

| Route                                     | Purpose                                                       | Backed by                                  |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| `/api/auth/[...nextauth]`                 | Auth.js sign-in/callback/session (Keycloak per tenant)        | CMS `tenants/by-host` (realm)              |
| `/api/auth/keycloak-logout`               | Keycloak logout redirect                                      | —                                          |
| `/api/share/[tenantId]`                   | send a resource by SMS (Twilio / EMS)                         | CMS `tenants/:id` (SMS settings)           |
| `/api/share/[tenantId]/[id]`              | deprecated short-URL redirect                                 | Norse API                                  |
| `/api/resource-titles`                    | resource titles for a list of ids                             | Norse API                                  |
| `/api/search-config/[tenantId]/[locale]`  | public search settings for the widget (CORS `*`)              | CMS `app-config?tenantId=`                 |
| `/api/webhook`                            | client error alert to `WEBHOOK_ALERT_URL`                     | —                                          |
| `/api/health`, `/api/healthz`             | liveness; no CMS or DB check                                  | —                                          |
| `/api/metrics`                            | Prometheus metrics (`PROMETHEUS_TOKEN`)                       | —                                          |

Moving to the CMS: `/api/keycloak/domain-check` (called by Keycloak) and the
Pages route `/api/internal/printable-directory-pdf` (called by the delivery
job). Not served by the app: `/admin`, Payload's `/api/[...slug]`,
`/api/internal/*`, `/api/getTenantBasicConfig`, `/api/tenants/[tenantId]/config`.

Server Actions (favorites, printable directories, geocoding, search, short
URLs) are not `/api` routes but run in the app too; they call the Norse API,
plus the CMS for rows 8–10.
