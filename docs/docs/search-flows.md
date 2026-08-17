# Search request flows

This document describes how each search engine mode issues requests today, so the
behavior can be compared and used as context. It reflects the frontend code in
`src/app/(app)/shared`. The classification/embedding/ranking is done by the external
Norse API (`API_URL`); the frontend only orchestrates calls and builds the final
`/search` URL.

## Engines and query types

- Engine (`appConfig.search.searchEngine`): `classic` | `hybrid` | `ai_classification`.
- Query type sent to `/search` (`query_type`): `text` | `hybrid` | `taxonomy`.

`query_type` is resolved by `deriveQueryType` in
[search-utils.ts](../../src/app/(app)/shared/lib/search-utils.ts):

1. `originQueryType === 'taxonomy'` → `taxonomy`.
2. Query string is a taxonomy code / code list / JSON → `taxonomy`.
3. Else engine `hybrid` or `ai_classification` → `hybrid`, otherwise → `text`.

So the four comparable combinations are:

| Combination       | engine             | query_type | taxonomy param |
| ----------------- | ------------------ | ---------- | -------------- |
| Classic (text)    | `classic`          | `text`     | none           |
| Taxonomy          | any                | `taxonomy` | optional       |
| Hybrid            | `hybrid`           | `hybrid`   | none           |
| Hybrid + taxonomy | `ai_classification`| `hybrid`   | yes (filter)   |

## Core search request

All engines ultimately call `GET {API_URL}/search` via `findResourcesOrigin` in
[search-service.ts](../../src/app/(app)/shared/services/search-service.ts).

Query string (built with `qs.stringify`):

```
query, query_label, query_type, taxonomy (comma-joined), location, coords,
distance, sort, page, locale, limit, tenant_id, filters, age
```

Headers: `accept-language`, `x-api-version: 1`, `x-api-key`, `x-tenant-id`.

## Classic / Hybrid / Taxonomy (non-AI)

Triggered from `onSubmit` → `navigateClassicSearch` in
[search-dialog.tsx](../../src/app/(app)/shared/components/search/search-dialog.tsx).
This is a single hop: build `/search?...` URL and navigate. The results page calls
`findResourcesOrigin`.

```
User submits query
  → deriveQueryType (text | hybrid | taxonomy)
  → GET /search?query=...&query_type=...&[taxonomy=...]&...
  → results
```

- Classic: `query_type=text`, no taxonomy.
- Hybrid: `query_type=hybrid`, no taxonomy.
- Taxonomy: `query_type=taxonomy`, taxonomy codes as the query/filter.

## AI classification

Used when `searchEngine === 'ai_classification'` and the query is free text.
Two AI endpoints precede the final `/search` call.

### 1. Predict
[ai-classification-search-service.ts](../../src/app/(app)/shared/services/ai-classification-search-service.ts):

```
GET {API_URL}/search/predict?query=<q>&top_k=150
→ { scenario, options[], hsis_taxonomies[] }
```

- `options[]` carry `results_count` (per-need card count, computed server-side).
- `scenario` decides the path:
  - `search` → go straight to `/search` with predicted `hsis_taxonomies`.
  - `search_and_notify_*` → `/search` + notify flag.
  - `clarify_*` → show category cards, wait for user.

### 2. Re-rank (after clarify)
On confirm, the frontend builds `need_weights` (`buildAiNeedWeights`): selected
needs keep their score, deselected pre-selected needs → `0.1`. Then:

```
GET {API_URL}/search/re-rank?need_weights=<json>&top_k=150
→ { hsis_taxonomies[] }
```

These taxonomies become the hard `taxonomy` filter.

### 3. Final search
`buildAiSearchUrl` always sets `query_type=hybrid` plus `taxonomy=<rerank codes>`:

```
GET /search?query=<q>&query_type=hybrid&taxonomy=<codes>&entry=search_card
```

```
Predict → (clarify cards) → Re-rank → /search (hybrid + taxonomy)
```

## Comparison-tool checklist

To replicate each mode, call `GET {API_URL}/search` with:

- Classic: `query_type=text`.
- Taxonomy: `query_type=taxonomy`, `taxonomy=<codes>`.
- Hybrid: `query_type=hybrid`.
- Hybrid + taxonomy: `query_type=hybrid`, `taxonomy=<predict|re-rank codes>`.

AI extras: `GET /search/predict?query&top_k` and
`GET /search/re-rank?need_weights&top_k`. Note `predict` counts use a different
weight map than `re-rank`, so per-need counts won't equal final result counts.

## Data sources: database vs search API

There are two separate data layers — they are not the same store:

- **Payload CMS → PostgreSQL** (not MongoDB): configured in
  [payload-config.ts](../../src/payload/payload-config.ts) with `postgresAdapter`.
  Holds tenant/site config: `Tenants`, `ResourceDirectories`, media, taxonomy
  scorecards, search settings. Accessed via `getPayloadSingleton().find(...)`
  ([getPayloadSingleton.ts](../../src/payload/getPayloadSingleton.ts)). This drives
  branding, feature flags, facets, and the `searchEngine` choice.
- **Norse search API → Elasticsearch-style index**: the actual resource documents
  returned by `/search` (hits, taxonomies, facets, location). The frontend never
  queries resources from Postgres; it always hits `{API_URL}/search`.

So: config = Postgres/Payload; resources = external API.

## Displaying resources

1. The server page [search/page.tsx](../../src/app/(app)/[locale]/(rest)/search/page.tsx)
   parses params and calls `findResourcesV2` (geospatial) or `findResources`.
2. Hits are normalized in `transformSearchHits`
   ([search-service.ts](../../src/app/(app)/shared/services/search-service.ts)) into
   `ResultType` (name, address, phone, website, taxonomies, facets, coordinates).
3. Results are placed in the `resultsAtom` (Jotai). `ResultsSection`
   ([results-section.tsx](../../src/app/(app)/features/search/components/results-section.tsx))
   renders cards, total, pagination, sort (hidden for `hybrid`), print/share.
4. Card layout comes from `card-layout-renderer` + `card-component-registry`,
   configurable per tenant.

## Map

- `MapContainer` ([map-container.tsx](../../src/app/(app)/features/search/components/map-container.tsx))
  reads `resultsAtom`, builds markers from `result.location.coordinates`, and passes
  them to `MapRenderer`.
- `MapRenderer` ([map-renderer.tsx](../../src/app/(app)/shared/components/map/map-renderer.tsx))
  dynamically loads an adapter; default is **maplibre** (mapbox adapter also exists).
  Style/key from `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` / `NEXT_PUBLIC_MAPBOX_*`.
- `MapPopup` shows resource detail; distance computed against `userCoordinatesAtom`.
