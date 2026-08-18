# Agents

Norse is Connect211's open-source community-resource search engine: a Next.js 16
(App Router) app with Payload CMS 3 embedded in the same process, serving a
multi-tenant directory of Human Services Data Specification (HSDS) resources.
Each tenant (a `ResourceDirectory` in Payload) gets its own branding, feature
flags, and search behavior via `AppConfig` (`src/types/appConfig.ts`), resolved
per-request from the host in `src/app/(app)/shared/utils/appConfig.ts`. There is
no true anonymous/tenant-less request — see "Norse API tenant requirement" below.

See [docs/architecture.md](/docs/architecture.md) for the directory layout,
route-group split, and feature-folder conventions before making structural
changes (new routes, new feature folders, moving files).

See [e2e/AGENTS.md](/e2e/AGENTS.md) for Playwright e2e test conventions (waiting rules, selectors, helper module map).

Other docs, load only when the task touches that area:

- [docs/custom-attributes.md](/docs/custom-attributes.md) — tenant-configurable generic "Datum" fields on resource/search-card layouts.
- [docs/printable-directories.md](/docs/printable-directories.md) — curated branded PDF directory feature.
- [docs/ai-search-legacy-link-flow.md](/docs/ai-search-legacy-link-flow.md) — legacy search URL normalization when a tenant's `searchEngine` is `ai_classification`.

## Feature documentation

Every non-trivial feature gets a doc at `docs/<feature-name>.md`, following
the existing files above as the template (purpose, where it's configured,
high-level architecture). When building a new feature, create its doc in the
same change and add it to the "Other docs" list above. When changing an
existing feature's behavior, update its doc in the same change — don't let
`docs/*.md` drift from what the code actually does.

## Local environment safety

`DATABASE_URI` and `CACHE_REDIS_URI` must point at a local/dev Postgres and
Redis (Valkey), never a shared or production instance — both hold live tenant
data (`compose.yaml` provisions local `norse-db`/`valkey` services for this).
See [docs/architecture.md](/docs/architecture.md#infrastructure--external-services)
for what each cached/stored value actually is (including Keycloak, S3, Umami,
and the `mboa` tenant's special deployment).

## Commands

- `npm run dev` / `npm run build` / `npm run lint` / `npm run format` (`format:check` in CI).
- `npx tsc --noEmit -p tsconfig.json` — full type check; not run by `lint`, and `get_errors` can show stale results on newly created files, so prefer this when in doubt.
- `npm run create-migration -- <name>` then regenerate types — required after any Payload schema change (see workflow below).
- `npm run generate:api-sdk` — regenerate the Norse API SDK client from the OpenAPI spec (see workflow below).
- `npm run test:e2e` (and `test:e2e:<project>` variants) — Playwright suites; see `e2e/AGENTS.md`.
- CI (`pull-request-check.yml`) runs `lint`, `format:check`, `build` — match these locally before considering work done.

## Conventions

- Import paths: `@/*` → `src/*`, `@payload-config` → `src/payload/payload-config.ts`, `@payload-types` → `src/payload/payload-types.ts` (tsconfig.json). Imports are auto-sorted by `@trivago/prettier-plugin-sort-imports` — run `npm run format` rather than hand-ordering them.
- No default `React` import in TSX (ESLint `no-restricted-imports`); use named imports only.
- `tsconfig.json` has `strict: false` but `strictNullChecks: true` — null/undefined handling is checked, other strict rules are not.
- ESLint ignores generated/vendored code: `src/payload/migrations`, `src/payload/payload-types.ts`, `src/lib/api/generated`, `.agents/`, `.claude/`, `widget/`. Don't hand-edit files under these paths — regenerate instead.

## Payload Feature Workflow

When working on a Payload feature, follow this workflow:

1. Open the Payload dashboard first and decide where the new config or field should live in the admin UI. Place it where a content manager would naturally expect to find it.
2. Find the corresponding Payload config in code. For search-related settings, this often means [src/payload/collections/ResourceDirectories/tabs/search.ts](/src/payload/collections/ResourceDirectories/tabs/search.ts).
3. Add the new field to the Payload config.
4. Decide whether the field should be localized. If the value is user-facing copy, it will often need `localized: true`.
5. If the field is a localized search text, add it to `SEARCH_TEXT_FIELDS` in [src/payload/jobs/translate.ts](/src/payload/jobs/translate.ts) so automatic translation continues to work.
6. Create the Payload migration and regenerate types after the schema change. Use `npm run create-migration -- <name>` and then regenerate types.
7. Prefer additive, backward-compatible changes. Do not push destructive migrations directly unless there is a clear, intentional reason and the change has been reviewed with backward compatibility in mind.

For simple extensions, expect the work to include both the admin schema change and the generated migration/types so deployed environments can boot cleanly and apply `payload migrate` successfully.

## OpenAPI SDK Workflow

The Norse API is a separate NestJS service. For internal API integrations, treat OpenAPI as source of truth and use generated SDK clients — never hand-write `fetch` calls to it.

1. Generate SDK with `npm run generate:api-sdk`.
2. Use shared clients from `src/lib/api/clients.ts` instead of creating ad-hoc SDK instances in feature files.
3. Prefer generated DTOs from `src/lib/api/generated/data-contracts.ts` for API contracts.
4. Remove duplicate hand-written API request/response types when the generated type already exists.
5. Keep app-specific UI/domain types when they represent transformed view models (not raw API contracts).
6. If API behavior and generated types diverge, update the OpenAPI spec first, then regenerate.

## Norse API tenant requirement

Every Norse API request must include a tenant id (`x-tenant-id` / `tenant_id`).
Tenant defines the data blend; no-tenant requests are invalid.
Fail fast in the service that calls Norse API — do not invent shared cache keys
or send anonymous requests.
