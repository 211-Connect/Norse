# CMS / public app split (`NORSE_ROLE`)

Status: implemented on `feat/cms-app-split` (2026-10-30), not yet rolled
out. See [Rollout](#rollout) for what is left to do on DigitalOcean.

## Purpose

Norse runs as two DigitalOcean apps built from **one image**:

| App     | `NORSE_ROLE` | Serves                                                                                       | Has access to                                                  |
| ------- | ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **cms** | `cms`        | Payload admin, Payload REST, the CMS internal API, Payload jobs, migrations, PDF rendering   | Postgres, S3, SendGrid, Keycloak admin, Redis, Norse API        |
| **app** | `app`        | Public directory pages, search, auth (Auth.js/Keycloak), share links, printable directories  | Norse API, the CMS internal API, Redis (cache only), Google     |

The public app never opens a database connection and never initializes
Payload. Everything it reads from Payload it gets from the CMS over HTTP.

`NORSE_ROLE=all` (the default) is the single process both halves ran in
before the split. It keeps local dev and e2e working with no extra setup.

## The role switch (`src/lib/norse-role.ts`)

- `getNorseRole()` reads `NORSE_ROLE` (`app` | `cms` | `all`, default `all`);
  any other value fails at startup (the proxy reads it at module load).
- `runsPayload()` is false only for `app`. It gates:
  - **Jobs**: `jobs.shouldAutoRun` in `payload-config.ts`.
  - **Migrations**: the Dockerfile `CMD` skips `payload migrate` for `app`.
  - **The admin and Payload REST**: `cmsOnly` in the generated
    `(payload)/admin/[[...segments]]/page.tsx` and `(payload)/api/[...slug]/route.ts`
    (local changes to generated files, marked in them), `/api/getTenantBasicConfig`,
    `/api/tenants/[tenantId]/config` and the Pages route
    `/api/internal/printable-directory-pdf` answer 404 in `app`.
  - **Health**: `/api/healthz` skips the Postgres check in `app`.
- `servesPath(role, pathname)` decides which **pages** a role serves; the
  proxy answers 404 for the rest. In `cms` every public page is a 404 and `/`
  redirects to `/admin`. The proxy matcher skips `/admin` and `/api` and must
  keep doing so: when the proxy matches a route, Next.js buffers its request
  body for it (10 MB limit), which would break large media uploads. That is
  why `/admin` and `/api` are gated in the route files instead.
- `getPayloadSingleton()` throws (and logs `payload_used_in_app_role` with
  the stack) in `app`. Payload's own route files call `getPayload` directly,
  hence `cmsOnly` there.
- ESLint (`eslint.config.js`) forbids importing `getPayloadSingleton`,
  the Payload config, `@/payload/collections/*/actions` and
  `@/payload/services/*` (except `translationService`) from app code
  (`src/app/(app)`, `src/lib`, `src/proxy.ts`, …). Type imports are allowed.
  The exempt files are the CMS side of features that live under `(app)`,
  listed in the config.

## The bridge (`src/lib/cms/`)

The only app-side code that touches CMS data. Each function picks its source
with `isCmsRemote()`:

| Role                                 | Source                                                     |
| ------------------------------------ | ---------------------------------------------------------- |
| `cms`                                | Payload, in process                                        |
| `app` or `all` with `PAYLOAD_CMS_URL` | the CMS internal API over HTTP (`cmsRequest`)              |
| `all` without `PAYLOAD_CMS_URL`       | Payload, in process (local dev)                            |
| `app` without `PAYLOAD_CMS_URL`       | throws: `PAYLOAD_CMS_URL is required when NORSE_ROLE=app` |

| Bridge function (`@/lib/cms/...`)                  | Used by                                                                                                                   | CMS side                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `tenants` `getTenantByHost`                        | `getServerSession`, `api/auth/[...nextauth]`, `api/auth/keycloak-logout`, share and favorites pages, `robots.ts`, `lib/blocked-traffic.ts` | `findTenantByHost`                                |
| `tenants` `getTenantById`                          | `api/share/[tenantId]`, `lib/api/getTenantApiKey.ts` (the Norse API key is a tenant field)                               | `findTenantById`                                  |
| `tenants` `getTenantByRealmId`                     | `api/keycloak/domain-check` (served by both apps)                                                                         | `findTenantByRealmId`                             |
| `getAppConfig` in `shared/utils/appConfig.ts`      | every page                                                                                                                | `buildAppConfig` (`shared/utils/buildAppConfig.ts`) |
| `search-config` `getSearchConfig`                  | `api/search-config/[tenantId]/[locale]` (widget, CORS `*`)                                                                | `buildSearchConfig`                               |
| `translation-usage` `getTranslationAllowance`, `recordTranslationUsage` | `runMeteredTranslation`, the directory page                                                          | `translation-usage-store.ts`                      |
| `tenant-media` `uploadTenantMedia`                 | `uploadPrintableDirectoryImage`                                                                                           | `payload/services/tenantMedia.ts`                 |
| `printable-directory-deliveries` `sendDeliveryTest` | `sendPrintableDirectoryDeliveryTest` ("Send to me now")                                                                  | `scheduled-pdf-delivery/send-delivery-test.ts`    |

The proxy's tenant config lookup (`/api/getTenantBasicConfig`) does its own
fetch to `PAYLOAD_CMS_URL` (see [architecture.md](/docs/architecture.md)).

**Caching** is unchanged: the bridge caches under the same keys as the
Payload lookups (`tenant:<host|id>`, `tenant_api_key:<id>`,
`app_config:<host>:<locale>`, `search_config:<id>:<locale>`), memory then
Redis then the CMS. The CMS's `revalidateCache` hooks delete the Redis keys
on save; memory entries expire within a minute, as they already did across
instances. (The planned Redis pub/sub is not needed for that reason.)

Translation still runs in the app (Google), only metering moved: the app
needs the translation credentials, the CMS needs them for its own jobs.

## CMS internal API (`src/app/(payload)/api/internal/`)

Every route is wrapped in `internalRoute` (`src/lib/cms/internal-route.ts`):
404 in `app`, 401 without `x-internal-api-key: $CMS_INTERNAL_API_KEY`
(constant-time compare), JSON answers, `null` for "not found", 500 with a
log line on a throw.

| Endpoint                                              | Body / query                                    | Returns                                  |
| ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| `GET tenants/by-host`                                 | `?host=`                                        | `Tenant` or `null`                       |
| `GET tenants/by-id`                                   | `?id=`                                          | `Tenant` or `null`                       |
| `GET tenants/by-realm`                                | `?realmId=`                                     | `Tenant` or `null`                       |
| `GET app-config`                                      | `?host=&locale=`                                | `CachedAppConfig` (no `baseUrl`/`sessionId`) |
| `GET search-config`                                   | `?tenantId=&locale=`                            | `SearchConfig` or `null`                 |
| `POST translation-usage/allowance`                    | `{ tenantId, userEmail }`                       | `TranslationAllowance`                   |
| `POST translation-usage/record`                       | `{ context, usage }`                            | `null`                                   |
| `POST tenant-media`                                   | multipart `tenantId`, `file`                    | `{ url }`                                |
| `POST printable-directory-deliveries/test`            | `DeliveryTestRequest`                           | `{ status }`                             |

Plus, outside `/api/internal`: `GET /api/getTenantBasicConfig?host=` (same
key) for the proxy, the Pages route `POST /api/internal/printable-directory-pdf`
(`INTERNAL_API_KEY`, called by the delivery job), and
`GET /api/tenants/[tenantId]/config` (`PAYLOAD_APP_CONFIG_API_KEY`, external
consumers; CMS only).

The tenant responses are full tenant documents, credentials included (Norse
API key, SMS provider settings), exactly what the app cached in Redis before
the split. They are only served with the internal key, on a server-to-server
hostname.

## Public app endpoints (`NORSE_ROLE=app`)

| Route                                    | Purpose                                                | Backed by                     |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------- |
| `/api/auth/[...nextauth]`                | Auth.js (Keycloak realm per tenant)                    | `getTenantByHost`             |
| `/api/auth/keycloak-logout`              | logout redirect                                        | `getTenantByHost`             |
| `/api/share/[tenantId]`                  | send a resource by SMS                                 | `getTenantById`               |
| `/api/share/[tenantId]/[id]`             | deprecated short-URL redirect                          | Norse API                     |
| `/api/resource-titles`                   | resource titles for ids                                | Norse API                     |
| `/api/search-config/[tenantId]/[locale]` | widget search settings (CORS `*`)                      | `getSearchConfig`             |
| `/api/keycloak/domain-check`             | Keycloak domain allow-list check (also on the CMS)     | `getTenantByRealmId`          |
| `/api/webhook`                           | client error alerts                                    | —                             |
| `/api/health`, `/api/healthz`, `/api/metrics` | liveness and metrics                              | —                             |

Server Actions (favorites, printable directories, search, geocoding, short
URLs) also run in the app: Norse API, plus the bridge for image uploads,
translation metering and test sends.

## Networking on DigitalOcean

Two separate apps cannot use App Platform's internal networking, and
loopback (`127.0.0.1`) does not work there, so every server-to-server call
uses a URL from the environment. **That URL must not sit behind the
Cloudflare WAF rules that answered 403 to the proxy's tenant config lookup**,
or every page inherits the failure. In order of preference:

1. `cms-internal.<domain>`: a DNS-only (grey cloud) record pointing at the
   CMS app, used only server to server.
2. A Cloudflare WAF skip rule for `/api/internal/*` and
   `/api/getTenantBasicConfig` carrying the internal key header.

The admin can stay on a Cloudflare-proxied `cms.<domain>`.

## Environment

| Variable                                                       | app | cms | Notes                                                                 |
| -------------------------------------------------------------- | :-: | :-: | --------------------------------------------------------------------- |
| `NORSE_ROLE`                                                   | `app` | `cms` |                                                                     |
| `PAYLOAD_CMS_URL`                                              |  ✓  |     | the CMS server-to-server URL; must not be set on the CMS (ignored)    |
| `CMS_INTERNAL_API_KEY`                                         |  ✓  |  ✓  | new random value; replaces `PAYLOAD_API_ROUTE_SECRET`                 |
| `DATABASE_URI`, `DATABASE_POOL_*`, `PAYLOAD_SECRET`            |     |  ✓  |                                                                       |
| `MEDIA_S3_*`, `MEDIA_DO_CDN_ENDPOINT`                          |     |  ✓  |                                                                       |
| `SENDGRID_API_KEY`, `KEYCLOAK_ADMIN_SECRET`                    |     |  ✓  |                                                                       |
| `CUSTOM_AUTH_HOST`                                             |     |  ✓  | the admin host, so password-reset links point at the CMS              |
| `INTERNAL_APP_URL`                                             |     |  ✓  | the CMS's own server-to-server URL (PDF render route)                 |
| `PAYLOAD_APP_CONFIG_API_KEY`                                   |     |  ✓  | external `/api/tenants/[id]/config` consumers                         |
| `CACHE_REDIS_URI`                                              |  ✓  |  ✓  | the same Redis: the CMS deletes keys the app reads                    |
| `API_URL`, `INTERNAL_API_KEY`                                  |  ✓  |  ✓  | Norse API                                                             |
| `GOOGLE_TRANSLATE_CREDENTIALS_BASE64`, `AZURE_TRANSLATOR_*`    |  ✓  |  ✓  | app: printable directory translation; cms: translation jobs           |
| `KEYCLOAK_INTERNAL_SECRET`                                     |  ✓  |  ✓  | `/api/keycloak/domain-check` is on both                               |
| `NEXTAUTH_*`, `KEYCLOAK_*` (client), `ARCJET_*`, Umami, maps, Twilio/EMS | ✓ |  |                                                                   |

## Rollout

Each step keeps production working.

1. **Rotate the secret.** Generate `CMS_INTERNAL_API_KEY` (e.g.
   `openssl rand -base64 32`) and set it on the existing app. Remove
   `PAYLOAD_API_ROUTE_SECRET` (it leaked into logs).
2. **Create the CMS app** on DigitalOcean from the same image with
   `NORSE_ROLE=cms` and the cms column above. Give it `cms.<domain>` (admin)
   and `cms-internal.<domain>` (DNS-only). It runs migrations and jobs.
3. **Point the existing app at it**: set `PAYLOAD_CMS_URL` to
   `https://cms-internal.<domain>` while it is still `NORSE_ROLE=all`. It now
   reads all CMS data over HTTP but still has its database as a safety net.
   Watch `cms_request_failed` and `tenant_basic_config_fetch_failed` logs and
   page latency.
4. **Cut the cord**: set `NORSE_ROLE=app` on the public app and remove
   `DATABASE_URI`, `PAYLOAD_SECRET`, `MEDIA_S3_*`, `SENDGRID_API_KEY`,
   `KEYCLOAK_ADMIN_SECRET`. Any missed database path now fails with
   `payload_used_in_app_role` in the logs.
5. **Move admin users** to `cms.<domain>/admin` (bookmarks, Keycloak/Umami
   links, docs).
6. **Optional: separate builds** that exclude `(payload)` and `src/payload/**`
   from the app bundle (smaller image, faster cold start).

## Decisions

Agreed 2026-10-30:

1. **Redis stays in the app** as a cache, never a source of truth.
2. **Nothing on the public app uses the Payload admin cookie**; the admin
   moves to the CMS domain with no app-side changes.
3. **No fail-closed login wall.** If the tenant config cannot be fetched, the
   proxy keeps its fail-open behaviour; the goal is that the fetch never fails
   (non-WAF hostname, Redis cache, alerting on
   `tenant_basic_config_fetch_failed`).
4. **`/api/tenants/[tenantId]/config` lives only in the CMS.**
5. **The CMS runs the whole image**, and the role decides what answers. That
   keeps the PDF render route and `buildAppConfig` working there without a
   second build.
6. **The CMS returns the built `AppConfig`**; the app only adds `baseUrl` and
   `sessionId`.

## Known gaps

- The proxy's `hasActiveSession` (login-wall tenants) still calls
  `/api/auth/session` on the tenant's public host, through Cloudflare. It is
  an app route, so it works after the split, but it can hit the same WAF.
- In `cms`, the public app's `/api` routes (`/api/auth`, `/api/share`, …)
  are not gated; nothing links to them on the CMS host.
