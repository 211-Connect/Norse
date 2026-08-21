# AI Search Legacy-Link Flow

## Purpose

This document explains the full AI classification search flow and how legacy search URLs are normalized when AI search is enabled.

It is intended for engineering agents and contributors implementing or modifying search behavior.

## High-Level Behavior

### AI disabled

If tenant search engine is not AI classification (`search.searchEngine !== 'ai_classification'`), keep search behavior unchanged.

### AI enabled

For AI-enabled tenants, search should converge to canonical hybrid URLs with taxonomy values.

Canonical shape:

`/search?query=...&query_type=hybrid&taxonomy=...`

Compatible existing params are preserved, while `page` is dropped during normalization.

## Terminology

- **AI enabled**: `appConfig.search.searchEngine === 'ai_classification'`
- **Legacy link**: old search URL that does not already provide canonical AI taxonomy state
- **Canonical AI URL**: hybrid query type with taxonomy values in URL
- **Clarification flow**: follow-up choice UI where user selects categories before rerank
- **Skip marker**: query param marker used to bypass repeated classify-on-load loops

## Decision Table (A/B/C/D)

Applies only when AI is enabled.

### A) `query_type=hybrid` with taxonomy present

- Run normal hybrid search.
- Do not auto-open AI clarification UI.

### B) `query_type=hybrid` with no taxonomy

- Treat as legacy AI URL.
- Run server-side prediction using URL query.
- If prediction yields final taxonomy set: redirect to canonical AI URL.
- If prediction requires clarification: render page results and preload clarification UI.

### C) `query_type=taxonomy`

- Run normal taxonomy search.
- Do not auto-open AI clarification UI.

### D) `query_type=text`

- Same behavior as case B (legacy URL requiring server-side AI prediction).

## End-to-End Runtime Flow

### 1) Server gate (`/search` page)

Search page parses URL params and resolves whether to search immediately or classify first.

- Evaluate engine + query + query type + taxonomy + skip marker.
- If gate resolves to classify:
  - call `predictSearchNeeds` on server;
  - direct-search scenarios (`search`, `search_and_notify_*`) redirect immediately to canonical AI URL;
  - clarification scenarios return preloaded options to client and continue normal results query behind modal.

### 2) Client hydration and one-shot modal open

Preloaded clarify payload is hydrated into Jotai and consumed once by search layout.

- open dialog one time per trigger key;
- clear prefill state after applying it;
- avoid loops by tracking consumed trigger keys.

### 3) Dialog clarification flow

Uses existing modal components and actions:

- **Skip**: `router.replace` to fallback search URL with skip marker.
- **Confirm**: call rerank, then `router.replace` to canonical AI URL with taxonomy.
- **Close while clarifying**: same fallback as skip to avoid immediate reopen loop.

### 4) Failure handling

- Predict failure: fallback to normal search flow.
- Rerank failure: show existing error toast and fallback to normal search with skip marker.

## URL Canonicalization Rules

### Required canonical fields

- `query`
- `query_type=hybrid`
- `taxonomy=<comma-separated taxonomies>`

### Preserved params

- all compatible params from incoming URL (location, coords, distance, filters, sort, age, etc.)

### Dropped/overridden params

- always drop `page`
- remove/override legacy AI flow params (`taxonomy`, `query_type`, temporary skip marker) with canonical values

### Navigation semantics

- server-side direct canonicalization: `redirect(...)`
- client-side normalization/fallback actions: `router.replace(...)`

## Implementation Map

- gate + server predict + redirect + prefill payload:
  - [src/app/(app)/[locale]/(rest)/search/page.tsx](src/app/(app)/[locale]/(rest)/search/page.tsx)
  - [src/app/(app)/features/search/utils/handleLegacyDeepLinks.ts](src/app/(app)/features/search/utils/handleLegacyDeepLinks.ts)
- AI URL/canonical helpers + legacy param parsing:
  - [src/app/(app)/features/search/utils/buildSearchUrl.ts](src/app/(app)/features/search/utils/buildSearchUrl.ts)
  - [src/app/(app)/features/search/utils/parseLegacyAiClarifyParams.ts](src/app/(app)/features/search/utils/parseLegacyAiClarifyParams.ts)
- hydrated prefill state:
  - [src/app/(app)/shared/store/search.ts](src/app/(app)/shared/store/search.ts)
  - [src/app/(app)/shared/components/jotai-hydration.tsx](src/app/(app)/shared/components/jotai-hydration.tsx)
- one-shot dialog open:
  - [src/app/(app)/shared/components/search/main-search-layout/main-search-layout.tsx](src/app/(app)/shared/components/search/main-search-layout/main-search-layout.tsx)
- AI flow orchestration (predict/confirm/skip handlers):
  - [src/app/(app)/features/search/hooks/useOnSearchSubmit.ts](src/app/(app)/features/search/hooks/useOnSearchSubmit.ts)
  - [src/app/(app)/features/search/hooks/useNavigateAiSearch.ts](src/app/(app)/features/search/hooks/useNavigateAiSearch.ts)
  - [src/app/(app)/shared/components/search/search-dialog.tsx](src/app/(app)/shared/components/search/search-dialog.tsx)
- dialog UI reuse:
  - [src/app/(app)/shared/components/search/search-dialog.tsx](src/app/(app)/shared/components/search/search-dialog.tsx)
  - [src/app/(app)/shared/components/search/ai-classification-options.tsx](src/app/(app)/shared/components/search/ai-classification-options.tsx)

## Guardrails

1. Do not create new clarification UI components; reuse existing modal components.
2. Keep fallback path always available when AI services fail.
3. Preserve non-AI tenant behavior exactly.
4. Avoid looping auto-opens by using trigger keys and skip marker semantics.
5. Keep logic readable and additive; avoid coupling unrelated search concerns.

## Validation Checklist

1. AI disabled tenant: no behavior changes.
2. Case A: hybrid+taxonomy searches directly.
3. Case B: hybrid without taxonomy classifies on server and redirects or shows clarification.
4. Case C: taxonomy query type searches directly.
5. Case D: text query type behaves like B.
6. Confirm/skip/close in clarification path never creates reopen loops.
7. Canonicalization preserves compatible params and drops `page`.
8. AI failures always fallback to normal search flow.
