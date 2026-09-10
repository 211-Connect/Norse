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
- [docs/search.md](/docs/search.md) — how the search dialog's autocomplete, `queryType`/`query` model, and the `/search` request pipeline work, including organization search.
- [docs/ai-search-legacy-link-flow.md](/docs/ai-search-legacy-link-flow.md) — legacy search URL normalization when a tenant's `searchEngine` is `ai_classification`.
- [docs/search-deep-link-geocoding.md](/docs/search-deep-link-geocoding.md) — forward-geocoding a deep link's `location` when `coords` is missing (all tenants).

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

## Available Skills

Skills live in `.agents/skills/`. Load one via the skill tool when its trigger matches the task at hand.

### UI & Design

- **adapt** ([`.agents/skills/adapt`](.agents/skills/adapt/SKILL.md)) — responsive design across screen sizes/devices. Use for breakpoints, mobile layouts, touch targets, viewport adaptation.
- **animate** ([`.agents/skills/animate`](.agents/skills/animate/SKILL.md)) — add purposeful animation and micro-interactions to an existing feature.
- **audit** ([`.agents/skills/audit`](.agents/skills/audit/SKILL.md)) — run an accessibility/performance/theming/anti-pattern audit, producing a scored, severity-rated report.
- **bolder** ([`.agents/skills/bolder`](.agents/skills/bolder/SKILL.md)) — amplify a bland, generic, or overly safe design to add visual impact and personality.
- **clarify** ([`.agents/skills/clarify`](.agents/skills/clarify/SKILL.md)) — improve confusing UX copy: error messages, labels, microcopy, instructions.
- **colorize** ([`.agents/skills/colorize`](.agents/skills/colorize/SKILL.md)) — add strategic color to a monochromatic or dull-looking feature.
- **delight** ([`.agents/skills/delight`](.agents/skills/delight/SKILL.md)) — add joy, personality, and small delightful touches to make an interface memorable.
- **distill** ([`.agents/skills/distill`](.agents/skills/distill/SKILL.md)) — simplify and declutter a UI by stripping unnecessary complexity.
- **impeccable** ([`.agents/skills/impeccable`](.agents/skills/impeccable/SKILL.md)) — build distinctive, production-grade, non-generic frontend UI. Use for new components/pages/apps, or when another design skill needs project context (`craft`/`teach`/`extract` modes).
- **layout** ([`.agents/skills/layout`](.agents/skills/layout/SKILL.md)) — fix spacing, visual rhythm, and hierarchy problems (monotonous grids, crowded UI, alignment).
- **optimize** ([`.agents/skills/optimize`](.agents/skills/optimize/SKILL.md)) — diagnose and fix UI performance: slow loads, jank, bundle size, images.
- **overdrive** ([`.agents/skills/overdrive`](.agents/skills/overdrive/SKILL.md)) — push a UI implementation to the technical extreme (shaders, spring physics, scroll effects) when asked to "wow" or go all-out.
- **polish** ([`.agents/skills/polish`](.agents/skills/polish/SKILL.md)) — final pre-ship pass fixing alignment/spacing/consistency micro-issues.
- **quieter** ([`.agents/skills/quieter`](.agents/skills/quieter/SKILL.md)) — tone down an overly loud, aggressive, or garish design.
- **shape** ([`.agents/skills/shape`](.agents/skills/shape/SKILL.md)) — plan the UX/UI for a feature _before_ writing code; produces a design brief.
- **typeset** ([`.agents/skills/typeset`](.agents/skills/typeset/SKILL.md)) — fix typography: font choice, hierarchy, sizing, weight, readability.
- **web-design-guidelines** ([`.agents/skills/web-design-guidelines`](.agents/skills/web-design-guidelines/SKILL.md)) — review UI code against Web Interface Guidelines for accessibility/UX compliance.

### Framework & Platform Specific

- **arcjet** ([`.agents/skills/arcjet`](.agents/skills/arcjet/SKILL.md)) — add Arcjet security (rate limiting, bot detection, prompt-injection/PII blocking) to any code path: routes, API endpoints, AI tool calls, background jobs.
- **google-cloud-recipe-auth** ([`.agents/skills/google-cloud-recipe-auth`](.agents/skills/google-cloud-recipe-auth/SKILL.md)) — authenticate/authorize to Google Cloud services (ADC, service identities, human users).
- **jotai** ([`.agents/skills/jotai`](.agents/skills/jotai/SKILL.md)) — Jotai adapter for json-render's `StateStore` interface (`@json-render/jotai`).
- **keycloak-admin** ([`.agents/skills/keycloak-admin`](.agents/skills/keycloak-admin/SKILL.md)) — Keycloak realm/client/OAuth/user/role/group/theme administration via the Admin API.
- **payload** ([`.agents/skills/payload`](.agents/skills/payload/SKILL.md)) — work with Payload CMS collections, fields, hooks, access control; debugging validation, relationship, or transaction issues. See the Payload Feature Workflow below.
- **playwright-cli** ([`.agents/skills/playwright-cli`](.agents/skills/playwright-cli/SKILL.md)) — browser automation for navigating pages, filling forms, screenshots, and e2e-style extraction.
- **react-pdf** ([`.agents/skills/react-pdf`](.agents/skills/react-pdf/SKILL.md)) — generate PDF documents (invoices, reports, forms) with `@react-pdf/renderer`. Prefer over a generic "pdf" skill.
- **vercel-composition-patterns** ([`.agents/skills/vercel-composition-patterns`](.agents/skills/vercel-composition-patterns/SKILL.md)) — React composition patterns (compound components, render props, context) for refactoring boolean-prop-heavy components or designing reusable APIs.
- **vercel-react-best-practices** ([`.agents/skills/vercel-react-best-practices`](.agents/skills/vercel-react-best-practices/SKILL.md)) — React/Next.js performance guidelines (components, data fetching, bundling) from Vercel Engineering.
- **vercel-react-view-transitions** ([`.agents/skills/vercel-react-view-transitions`](.agents/skills/vercel-react-view-transitions/SKILL.md)) — implement React's View Transition API for page/route transitions, shared-element animations, list reorder, enter/exit animations.

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
