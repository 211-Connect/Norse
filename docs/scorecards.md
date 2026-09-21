# Taxonomy scorecards

Scorecards configure how a tenant's AI-classification search engine maps taxonomy codes to HSDS need-category weights. They live in the Norse API (`TaxonomyScorecard` endpoints) and are managed from the Payload admin UI at **Admin → Scorecards**.

## Where scorecards are used

- Public directory search when a tenant's `ResourceDirectory.search.searchSettings.searchEngine` is set to `ai_classification`.
- Direct API consumers (for example, Keeper) that explicitly request the `ai_classification` engine per request, even when the tenant's public directory is set to `classic` or `hybrid`.

## Where they are configured

- Payload admin: `ResourceDirectory → Search → Search Engine` selects `classic`, `hybrid`, or `ai_classification`. This controls the public directory behavior only.
- Payload admin: **Scorecards** lets internal users search HSIS taxonomies, edit need-category weights, save drafts, and enable a published version for the tenant.

## Authorization

All scorecard mutations and reads are gated to internal users (`super-admin` or `support`):

- `GET /api/taxonomy-scorecards/taxonomies`
- `GET /api/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode`
- `PUT /api/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode`
- `POST /api/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode/enable`

The `searchEngine` value no longer blocks scorecard editing. It is returned by the status endpoint as an advisory flag so the UI can show a notice when the tenant's public directory is not using AI classification.

## Key files

- `src/payload/endpoints/taxonomyScorecards.ts` — Payload endpoints that proxy to the Norse API.
- `src/payload/endpoints/taxonomyScorecardsAuthorization.ts` — shared internal-user/tenant authorization used by the endpoints.
- `src/payload/utilities/taxonomyScorecardsApi.ts` — Norse API SDK calls.
- `src/payload/components/scorecards/` — admin UI for searching, editing, and enabling scorecards.
- `src/payload/components/ScorecardsNavLink/` — tenant-scoped nav link that is visible to internal users.
