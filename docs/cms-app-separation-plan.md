# CMS / public app split (`NORSE_ROLE`)

Status: implemented on `feat/cms-app-split`, not yet rolled out. Deployment,
environment per app and the step-by-step rollout:
[cms-app-release-plan.md](/docs/cms-app-release-plan.md).

## Purpose

Norse runs as two components of one DigitalOcean app, built from one Dockerfile:

| App     | `NORSE_ROLE` | Serves                                                                                       | Has access to                                                  |
| ------- | ------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **cms** | `cms`        | Payload admin, Payload REST, the CMS internal API, Payload jobs, migrations, PDF rendering   | Postgres, S3, SendGrid, Keycloak admin, Redis, Norse API        |
| **app** | `app`        | Public directory pages, search, auth (Auth.js/Keycloak), share links, printable directories  | Norse API, the CMS internal API, Redis (cache only)            |

The public app never opens a database connection and never initializes
Payload. Everything it reads from Payload it gets from the CMS over HTTP.

`NORSE_ROLE=all` (the default) is the single process both halves ran in
before the split. It keeps local dev and e2e working with no extra setup.

## Deployments

Each environment has two DigitalOcean apps, multi-tenant and MBOA, and each has
two components: `norse-app` (public) and `norse-cms`. MBOA needs its own images
because `NEXT_PUBLIC_CUSTOM_BASE_PATH=/adresources` and
`NEXT_PUBLIC_WITH_TRAILING_SLASHES=true` are baked in at build time, in the
browser code and in Next.js's routing. The CMS needs them too: it serves its
routes under the base path and builds the links in emails and the widget
config from it.

| Image            | Dockerfile target | Build args                                  |
| ---------------- | ----------------- | ------------------------------------------- |
| `norse-app`      | `app`             |                                             |
| `norse-cms`      | `cms`             |                                             |
| `norse-app-mboa` | `app`             | base path `/adresources`, trailing slashes  |
| `norse-cms-mboa` | `cms`             | base path `/adresources`, trailing slashes  |

CI (`.github/workflows/deploy-images.yaml`, called by the development and
production deploys) builds all four. It pushes the CMS images first and waits
for each app's deployment to go active before it pushes the public images,
because the CMS runs migrations and the public app may call endpoints of the
same release. So a release is two deployments per app.

The admin moves to its own hostname, routed to `norse-cms` by a routing rule. Two things depended on the admin being
on a tenant's host:

- **Password-reset links** use `CMS_ADMIN_URL`. The tenant lookup in
  `getTenantResetOrigin` cannot match a CMS host, and trusting the request's
  `Host` header would let a forged header redirect the link.
- **`setCookieBasedOnDomain`** preselected the tenant from the host on login. A
  CMS host matches no tenant, so nothing is preselected and Payload's tenant
  selector starts from its default.

Admins may still open `/admin` on their tenant's host, for example
`https://search.wa211.org/admin`. In `app` builds, `next.config.js` rewrites
`/admin` and everything under it to `/api/cms-admin-redirect`, which answers with
a temporary redirect to the same page and query on `CMS_ADMIN_URL`. Without that
variable it is a 404. The rewrite exists so the proxy matcher can keep skipping
`/admin`, and the variable is read at runtime, so changing the URL needs no new
image. Payload's REST API on a tenant's host stays a 404.

## Builds (`NORSE_BUILD`, Dockerfile targets)

The Dockerfile has three targets: `app`, `cms`, and the default combined
image. The `app` and `cms` targets build with `NORSE_BUILD` set, which
`next.config.js` inlines into the code at build time, after
`bin/prepare-build-target.mjs` deletes the routes the target never serves:

| Target | Deleted before `next build`                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| `app`  | `src/app/(payload)` (admin, Payload REST, CMS internal API), `src/pages` (PDF render)    |
| `cms`  | `src/app/(app)/[locale]` (public pages), the app's own `/api/auth`, `cms-admin-redirect`, `share`, `resource-titles`, `search-config`, `webhook` |

Every in-process Payload path in the bridge (and in `/api/healthz`) is a
dynamic `import()` inside `if (process.env.NORSE_BUILD !== 'app')`, so the
`app` build drops it: its server bundle has no Payload, Postgres client or
translation clients (37 MB instead of 72 MB, traced `node_modules` 61 MB
instead of 93 MB). Keep new in-process branches in that shape: the import
must be written inside the guarded branch (a shared helper that wraps the
`import()` outside the branch keeps it in the bundle). Check with a target
build: `grep -rl 'cannot connect to Postgres' .next/standalone/.next/server`
must find nothing.

The prune script deletes source files, so it refuses to run without
`--yes`. It runs in the Docker build stages and in the throwaway CI checkouts
of the `build-target` pull request job, which also fails if Payload reappears
in the `app` bundle. Nothing outside the pruned
folders may import from them (today only types were, now in `src/types`).

## The role switch (`src/lib/norse-role.ts`)

- `getNorseRole()` reads `NORSE_ROLE` (`app` | `cms` | `all`, default `all`);
  any other value fails at startup (the proxy reads it at module load). In a
  target build the role is `NORSE_BUILD`, and a different `NORSE_ROLE` fails.
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
| `translation` `translateBatch`                     | `autoTranslatePrintableDirectoryText` (printable directory auto-translation)                                              | `batchTranslate` (`payload/services/translationService.ts`) |
| `printable-directory-deliveries` `sendDeliveryTest` | `sendPrintableDirectoryDeliveryTest` ("Send to me now")                                                                  | `scheduled-pdf-delivery/send-delivery-test.ts`    |

The proxy's tenant config lookup (`/api/getTenantBasicConfig`) does its own
fetch to `PAYLOAD_CMS_URL` (see [architecture.md](/docs/architecture.md)).

**Caching** is unchanged: the bridge caches under the same keys as the
Payload lookups (`tenant:<host|id>`, `tenant_api_key:<id>`,
`app_config:<host>:<locale>`, `search_config:<id>:<locale>`), memory then
Redis then the CMS. The CMS's `revalidateCache` hooks delete the Redis keys
on save; memory entries expire within a minute, as they already did across
instances. (The planned Redis pub/sub is not needed for that reason.)

Translation runs in the CMS (Google/Azure credentials and the Redis
translation cache live there); the app sends the texts and meters the
results it gets back (`fromCache` results are not billed).

## CMS internal API (`src/app/(payload)/api/internal/`)

Every route is wrapped in `internalRoute` (`src/lib/cms/internal-route.ts`):
404 in `app`, 401 without `x-internal-api-key: $PAYLOAD_API_ROUTE_SECRET`
(constant-time compare), JSON answers, `null` for "not found", 500 with a
log line on a throw.

| Endpoint                                              | Body / query                                    | Returns                                  |
| ----------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| `GET tenants/by-host`                                 | `?host=`                                        | `Tenant` or `null`                       |
| `GET tenants/by-id`                                   | `?id=`                                          | `Tenant` or `null`                       |
| `GET tenants/by-realm`                                | `?realmId=`                                     | `Tenant` or `null`                       |
| `GET app-config`                                      | `?host=&locale=`                                | `CachedAppConfig` (no `baseUrl`/`sessionId`) |
| `GET search-config`                                   | `?tenantId=&locale=`                            | `SearchConfig` or `null`                 |
| `POST translation/batch`                              | `{ engine, inputs, sourceLocale }`              | `BatchTranslationResult[]`               |
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
| `/api/search-pins`                       | every result's map pin (`showAllResultsOnMap`)         | Norse API                     |
| `/api/search-config/[tenantId]/[locale]` | widget search settings (CORS `*`)                      | `getSearchConfig`             |
| `/api/keycloak/domain-check`             | Keycloak domain allow-list check (also on the CMS)     | `getTenantByRealmId`          |
| `/api/webhook`                           | client error alerts                                    | —                             |
| `/api/health`, `/api/healthz`, `/api/metrics` | liveness and metrics                              | —                             |

Server Actions (favorites, printable directories, search, geocoding, short
URLs) also run in the app: Norse API, plus the bridge for image uploads,
translation metering and test sends.

## Networking on DigitalOcean

Both components are in one app, so `norse-app` reaches `norse-cms` over the
app's private network: `PAYLOAD_CMS_URL=${norse-cms.PRIVATE_URL}`. That traffic
never leaves the app, so the Cloudflare WAF that answered 403 to the proxy's
tenant config lookup can't touch it. `norse-cms` reaches its own PDF render route
the same way (`INTERNAL_APP_URL=${_self.PRIVATE_URL}`), because loopback doesn't
work there.

The admin is browser traffic on its own public hostname. A routing rule for
that domain, above the rule matching all domains, sends it to `norse-cms`. It
can't share a tenant hostname by path, because the two builds' static files
under `/_next` differ.

## Environment and rollout

See [cms-app-release-plan.md](/docs/cms-app-release-plan.md): which variables
each app needs, DNS, the CI change, and the rollout steps with checks and
rollback.

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
7. **MBOA migrates together with multi-tenant, with its own CMS.** Its base path
   and trailing slashes are baked into its builds, so it cannot share images
   or a CMS with the multi-tenant deployment.
8. **CI builds only the four split images.** The Dockerfile's default combined
   target remains for local use; old `norse:<sha>` images remain for rollback.
9. **The existing apps stay; the split is at component level.** That gives private
   networking, one app id per deployment in CI, and rollback by flipping a routing
   rule back to `norse-search`.

## Known gaps

- The proxy's `hasActiveSession` (login-wall tenants) still calls
  `/api/auth/session` on the tenant's public host, through Cloudflare. It is
  an app route, so it works after the split, but it can hit the same WAF.
- The combined image run with `NORSE_ROLE=cms` still serves the public app's
  `/api` routes (`/api/auth`, `/api/share`, …). The `cms` image has none.
