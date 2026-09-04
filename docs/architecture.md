# Architecture

Read this before adding a new route, a new feature folder, or moving files. It
describes how the codebase is organized, not how any one feature works —
feature-specific behavior lives in `docs/*.md` (see [AGENTS.md](/AGENTS.md))
or in the code itself.

## Two Next.js apps in one process

`src/app` has two top-level route groups that behave like separate apps
sharing a build:

- `(app)` — the public/tenant-facing Next.js app (search, resource pages,
  favorites, printable directories, home). Everything under
  `src/app/(app)/` follows the feature-folder convention below.
- `(payload)` — the Payload CMS admin UI (`/admin`) and Payload's own API
  routes. Generated/framework-owned (`admin/importMap.js`, `layout.tsx` are
  ESLint-ignored) — don't hand-edit; regenerate via Payload CLI
  (`npm run generate:importmap`) if it drifts.

Payload itself is embedded via `withPayload()` in `next.config.js`, not a
separate service — `src/payload/payload-config.ts` is the single Payload
config (collections, endpoints, jobs) and is reached via the `@payload-config`
path alias.

## `(app)` structure: `features/` + `shared/`

```
src/app/(app)/
├── [locale]/         route segments (App Router pages/layouts only — thin)
├── features/         one folder per product area
│   ├── home/
│   ├── search/
│   ├── resource/
│   ├── favorites/
│   ├── printable-directories/
│   └── error/
└── shared/           cross-feature code
```

Convention: page/layout files under `[locale]/` stay thin — they fetch
data (`getAppConfigWithoutHost`, `initTranslations`, session), then delegate
to a component in the matching `features/<name>/components/` folder. Look at
an existing page (e.g. `[locale]/(rest)/favorites/page.tsx`) as the template
for a new route: resolve `appConfig` for the locale, call `arcjetProtectPage`,
initialize i18n namespaces, wrap children in `PageWrapper`.

`shared/` holds code used by more than one feature:

| Folder            | Contents                                                          |
| ------------------ | ------------------------------------------------------------------ |
| `utils/appConfig.ts` | Resolves `AppConfig` for a request (`getAppConfig` by host, `getAppConfigWithoutHost` by locale only) |
| `serverActions/`   | Next.js server actions, grouped by domain (`favorites/`, `printableDirectories/`) |
| `services/`        | Server-side data-fetching (e.g. `resource-service.ts`, `search-service.ts`) — call the Norse API via `src/lib/api/clients.ts` |
| `components/`      | Cross-feature UI (`page-wrapper`, `providers`, `directory-print/`) |
| `store/`           | Jotai atoms (e.g. `results.ts` — the `ResultType` shape used by search cards) |
| `context/`, `hooks/`, `theme/`, `i18n/`, `lib/` | As named |

A feature folder mirrors this shape at smaller scale (its own `components/`,
sometimes `hooks/`/`types/`), and can have two "parallel" component systems —
e.g. `search/components/search-card-components/` vs
`resource/components/resource-components/` both render the same
`ResourceComponentId`/`SearchCardComponentId` layout items but for different
surfaces (search result card vs full resource page). When adding a component
usable on both, make the resource-page one the source of truth and the
search-card one a thin wrapper around it.

## Multi-tenant `AppConfig`

Every tenant is a `ResourceDirectory` document in Payload. Nearly every
request-handling code path needs the resolved `AppConfig` for that tenant
(branding, feature flags, search engine, locales, layout config) — it's
fetched once per request via `getAppConfig`/`getAppConfigWithoutHost`
(`src/app/(app)/shared/utils/appConfig.ts`) and threaded through explicitly
(not global state). When adding a new per-tenant setting, add it to
`AppConfig` (`src/types/appConfig.ts`) and to the corresponding Payload tab
under `src/payload/collections/ResourceDirectories/tabs/` — see "Payload
Feature Workflow" in [AGENTS.md](/AGENTS.md).

## Search

Search behavior branches on `appConfig.search.searchEngine`:
`classic` | `hybrid` | `ai_classification`. The search page
(`[locale]/(rest)/search/page.tsx`) resolves the query, optionally geocodes a
location, calls `findResources` (legacy/classic+hybrid path) or the v2
geospatial path, then renders `SearchPageShell`. Search result cards and the
resource detail page render a tenant-configured list of layout components
(`cardLayout` / resource `leftColumn`/`rightColumn`) resolved through a
component registry — see the "parallel component systems" note above. See
[docs/search.md](/docs/search.md) for the full autocomplete/`queryType`
architecture, including the organization search flow.

## Norse API

`src/lib/api/clients.ts` holds the shared SDK client instances, generated
from an OpenAPI spec via `npm run generate:api-sdk` into
`src/lib/api/generated/`. Every request must carry a tenant id — see "Norse
API tenant requirement" in [AGENTS.md](/AGENTS.md). Prefer the generated DTOs
in `src/lib/api/generated/data-contracts.ts` over hand-written request/response
types; keep hand-written types only for transformed view models (e.g.
`ResultType` in `shared/store/results.ts`), not raw API contracts.

## Infrastructure & external services

### Database

Single Postgres instance, owned entirely by Payload (`@payloadcms/db-postgres`,
`DATABASE_URI`) — there's no separate app-level ORM; all reads/writes to
tenant config, resource directories, users, etc. go through Payload's local
API. **Point local `DATABASE_URI` at a local/dev Postgres, never at a shared
or production database** — migrations and routine dev usage would otherwise
mutate real tenant data. `compose.yaml`'s `norse-db` service provisions one
locally. `reset-db.sh` (gitignored, contains real prod credentials — never
commit or share it) is the internal workflow for pulling a fresh prod dump
into that local DB.

### Cache (Redis / Valkey)

`CACHE_REDIS_URI` backs `src/cacheService.ts`, which exposes three
purpose-scoped clients over three logical Redis DBs (`ioredis`'s numeric `db`
option — one connection URI, not three separate instances):

| Instance                  | DB # | Purpose                                                                                                                                                                          |
| -------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cacheService`             | 0    | General app cache                                                                                                                                                               |
| `translationCacheService`  | 1    | Translation job caching                                                                                                                                                          |
| `apiConfigCacheService`    | 2    | One-way config channel: Payload pushes tenant config (facets, hybrid search config, orchestration config, Keycloak realm id, enabled locales, analytics config) into Redis on save, so the **Norse API (NestJS)** can read current tenant config without calling back into Payload |

Point `CACHE_REDIS_URI` at a local Redis/Valkey for development
(`compose.yaml`'s `valkey` service) — same "don't touch shared state"
reasoning as the database.

### Auth (Keycloak)

Authentication is Keycloak via `next-auth`'s `KeycloakProvider` (`src/auth.ts`,
`src/app/(app)/api/auth/[...nextauth]/route.ts`). Each tenant (`Tenant` in
Payload) has its own Keycloak **realm**, configured as `tenant.auth.realmId` in
the Payload admin; `getKeycloakIssuer(realmId)`
(`src/utils/getKeycloakIssuer.ts`) builds the per-tenant issuer URL from
`KEYCLOAK_BASE_URL`. The realm id is also pushed through the
`apiConfigCacheService` channel above (`Tenants/hooks/pushRealmIdToCache.ts`)
so the Norse API can resolve auth per tenant. Branding (logo/colors) can sync
onto the Keycloak login theme — see
`ResourceDirectories/hooks/keycloakRealmBranding.ts`.

### Maps

Two map adapters exist side by side under
`src/app/(app)/shared/components/map/` (`mapbox/`, `maplibre/`), selected in
`map-renderer.tsx`. **MapLibre is the active adapter** (hardcoded
`adapterName = 'maplibre'`) — the Mapbox adapter and its env vars
(`NEXT_PUBLIC_MAPBOX_API_KEY`, `NEXT_PUBLIC_MAPBOX_STYLE_URL`) still exist in
the codebase but aren't wired up by default. `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`
points at a hosted style JSON.

### Storage (S3)

Tenant media (logos, favicons, etc.) is stored in S3-compatible object
storage via `@payloadcms/storage-s3`, configured with the `MEDIA_S3_*` env
vars, and served through Payload's `TenantMedia` collection and the
`/api/tenant-media/file/**` route (see `next.config.js` `images.remotePatterns`).

### Analytics (Umami)

`UMAMI_API_URL`/`UMAMI_TEAM_ID`/credentials configure a self-hosted Umami
instance. `Tenants/hooks/createUmamiWebsite.ts` auto-provisions an Umami
website per tenant; `NEXT_PUBLIC_UMAMI_SCRIPT_URL` is the client-side tracking
script. Resolved analytics config is also cached through the
`apiConfigCacheService` channel (`resolveAnalyticsContext.ts`).

### Locales & translations — two separate systems

Don't conflate these:

1. **Static UI copy** (`public/locales/<lang>/*.json`, i18next namespaces) —
   English source files are machine-translated into the other locales via
   `npm run sync-translations` (`bin/sync-translations.ts`, Azure/Google
   Translate). `categories.json`/`dynamic.json`/`suggestions.json` are
   excluded from this sync (generated separately, gitignored).
2. **Tenant CMS content** (localized Payload fields on `ResourceDirectories`,
   e.g. brand copy, search text) — auto-translated per tenant by the Payload
   jobs queue (`src/payload/jobs/translate.ts`) on save. See the "Payload
   Feature Workflow" step about `SEARCH_TEXT_FIELDS` in
   [AGENTS.md](/AGENTS.md) before adding a new localized field.

`src/payload/i18n/locales.ts` is the single source of truth for supported
locales (`locales`, `defaultLocale`) used by both systems.

### mboa — a specific tenant deployment

`mboa` is a real client with its own separate deployment, not just a generic
tenant: it runs with `NEXT_PUBLIC_CUSTOM_BASE_PATH=/adresources` and
`NEXT_PUBLIC_WITH_TRAILING_SLASHES=true` (see the commented-out block in
`.env.examples`), and its outbound requests are proxied through a known IP
allow-listed in Arcjet's bot detection (`MBOA_PROXY_IP` in
`src/lib/arcjet.ts`) instead of being flagged as a bot. Changes to
`NEXT_PUBLIC_CUSTOM_BASE_PATH`/trailing-slash handling or Arcjet rules should
be checked against this deployment.

### Historical note: Strapi → Payload

Norse originally ran on Strapi. `src/payload/migrations/` (notably
`tenants.ts`, and the `Strapi*` types in `types.ts`) is a one-time
data-migration tool that reads from a legacy Strapi instance
(`STRAPI_URL`/`STRAPI_TOKEN`) and writes into Payload — **it is not an active
integration**. Payload is the only CMS in current use; don't assume Strapi is
reachable or relevant outside that migration path.

## Payload (`src/payload/`)

| Folder        | Contents                                                                 |
| ------------- | ------------------------------------------------------------------------- |
| `collections/`| One folder per collection (`ResourceDirectories`, `Tenants`, `Users`, `TenantMedia`, `HybridSearchConfig`, `OrchestrationConfig`). `ResourceDirectories` is the tenant collection and is the largest — its `tabs/` split the admin UI (`search.ts`, `resource.ts`, etc.) |
| `endpoints/`  | Custom Payload REST endpoints, registered in `payload-config.ts`          |
| `jobs/`       | Payload jobs queue tasks, notably `translate.ts` (auto-translation — see repo conventions before touching localized fields) |
| `fields/`, `components/` | Reusable field configs and custom admin-UI React components   |
| `migrations/` | Generated, ESLint-ignored — never hand-edit; regenerate via `npm run create-migration -- <name>` |
| `payload-types.ts` | Generated, ESLint-ignored — regenerate via `npm run generate:types` after any schema change |

## Widget (`widget/`)

A separate, embeddable search widget (`search-modal`, `search-results-list`)
built independently of the main app and ESLint-ignored — treat it as a
distinct package, not part of the `(app)` feature-folder conventions above.
