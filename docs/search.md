# Search: autocomplete, `queryType`, and organization search

## Purpose

This document explains how the search dialog's autocomplete works, how the
`query`/`queryType` model flows from selection through to the `/search`
results page, and how organization search fits into that model. It is
intended for engineering agents and contributors implementing or modifying
search behavior — see also
[docs/ai-search-legacy-link-flow.md](/docs/ai-search-legacy-link-flow.md)
and [docs/search-deep-link-geocoding.md](/docs/search-deep-link-geocoding.md)
for narrower, adjacent flows.

## Search engine modes

`appConfig.search.searchEngine` is one of `classic` | `hybrid` |
`ai_classification`, set per tenant. It only affects how a *free-text* query
gets classified (see `deriveQueryType()` below) — it has no effect on
taxonomy or organization selections, which always bypass it.

## The four autocomplete groups

The search dialog's query input (`search-bar.tsx`) shows up to four grouped
sections, in this fixed order:

1. **Suggestions** — tenant-configured canned suggestions
   (`appConfig.suggestions`), held entirely in memory (no API call).
2. **Topics** (labeled "Categories" internally) — tenant-configured topic/
   subtopic tree (`appConfig.topics`), also in memory.
3. **Taxonomies** — HSDS taxonomy term matches for the current search text.
4. **Organizations** — organization name matches for the current search
   text. Only shown when the tenant's `enableOrganizationSearch` feature
   flag is on.

Groups 3 and 4 both come from a single API call, `GET /suggestion` (see
below), fetched through `useSearchSuggestions()`
(`src/app/(app)/shared/hooks/api/use-search-suggestions.ts`), debounced by
`SEARCH_DEBOUNCE_DELAY`. When at least two of the four groups have results,
each group is capped to its first 6 options (see the `atLeastTwo` truncation
in `search-bar.tsx`) so no single group crowds out the others.

## The `AutocompleteOption` / `query` model

Every option in the dropdown (`AutocompleteOption`, in
`src/app/(app)/shared/components/ui/autocomplete.tsx`) carries:
- `value` — the text shown in the row and typed into the input on selection.
- `query` — the machine value that eventually becomes the `/search` request's
  `query` param. For taxonomies this is the taxonomy **code**; for
  organizations this is the organization's **name** (see "Organization
  search" below); for free text it's just the typed text.
- `queryType` — `'text'` | `'taxonomy'` | `'organization'` | `'link'`, tags
  which of the above `query` is.
- `badge` — optional secondary text shown next to the row (taxonomy code
  when `showSuggestionListTaxonomyBadge` is on; organization city/state when
  `showSuggestionListOrganizationLocationBadge` is on).

Selecting an option copies `query`/`queryType`/`value` into the shared
`searchAtom` (via `setSearchTerm` in `search-bar.tsx`). **Clicking** an
option only populates the search bar — the user must still click the
"Search" button. **Pressing Enter** on a highlighted option commits the
selection *and* auto-submits the form (see `Autocomplete`'s keyboard
handling) — this asymmetry is intentional, not a bug.

## `QueryType` and `deriveQueryType()`

`src/app/(app)/shared/lib/search-utils.ts` defines the authoritative
`QueryType` enum (`text` | `hybrid` | `taxonomy` | `organization` |
`more_like_this`) and `deriveQueryType()`, which decides what `query_type`
actually gets sent to `/search`:

1. If the origin `queryType` is `'organization'` or `'taxonomy'`, that wins
   outright — free-text classification never overrides an explicit
   selection.
2. Otherwise, if the query string itself looks like a taxonomy code, treat
   it as `taxonomy` anyway (handles typed-in codes).
3. Otherwise, fall back to `hybrid` or `text` based on the tenant's
   `searchEngine`.

`buildSearchUrl()` (`src/app/(app)/features/search/utils/buildSearchUrl.ts`)
calls `deriveQueryType()` and writes `query`, `query_label`, and `query_type`
onto the `/search` URL. The results page reads them back verbatim via
`parseSearchParams.ts` — nothing downstream needs to know how a `queryType`
was derived, only what it is.

## The AI-classification precedent

For `ai_classification` tenants, a free-text query triggers a second API
call (`predictSearchNeeds`) *before* navigation, which can either resolve
directly to a `hybrid` search or open a clarification UI
(`AiClassificationOptions`) that ultimately calls `reRankSearchNeeds` and
then navigates. This is the precedent for "a second API call feeding a
`queryType` before the user reaches results" — organization search doesn't
need this (it resolves synchronously from the already-fetched suggestion
list), but it's useful context if a future queryType needs the same shape.

## Organization search

### Data flow

`GET /suggestion?query=<text>` (via the generated `Suggestion` SDK client,
`suggestionApiClient`) returns **both** taxonomies and organizations in one
response, unconditionally — there is no way to request one without the
other:
```json
{
  "taxonomies": [{ "id": "string", "code": "string", "name": "string" }],
  "organizations": [{ "organization_id": "string", "name": "string", "city": "string | null", "state": "string | null" }]
}
```
`getSearchSuggestions()`
(`src/app/(app)/shared/services/search-suggestions-service.ts`) wraps this
call with the standard per-request `x-tenant-id`/`accept-language`/
`x-api-key` headers (see the "Norse API tenant requirement" in
[AGENTS.md](/AGENTS.md)). `useSearchSuggestions()` exposes it as a
react-query hook. The `enableOrganizationSearch` flag does **not** change
what's requested — the API always returns both — it only controls whether
`search-bar.tsx` turns the `organizations` array into visible dropdown
options.

### Identity: name, not id

Selecting an organization sets `query = organization name` (an exact,
case-insensitive string), **not** an id. `GET /search?query_type=organization&query=<name>`
filters resources to that organization by name match. This is a deliberate
constraint, not an oversight: there is no `organization_id` field on the
resource/service-at-location search index, and the Norse API team confirmed
it can't be added without an external indexer change.

**Known limitation, accepted as-is**: if two organizations in the same
tenant share the exact same name, this filter cannot distinguish them —
selecting either produces identical `/search` results, even though the
dropdown's city/state badge makes them *look* distinguishable. This was a
deliberate product decision (ship with the limitation documented, not
mitigated in the UI) — don't "fix" this with dropdown warnings or dedup
logic without revisiting that decision first; do so only if a flagged-in
tenant actually reports confusion from it.

### Feature flags

- `enableOrganizationSearch` (default off, per tenant) — gates whether the
  Organizations group ever renders and whether `organization` is ever used
  as a `queryType` in that tenant's UI.
- `showSuggestionListOrganizationLocationBadge` (default off, per tenant) —
  gates the city/state badge on organization rows. Mirrors
  `showSuggestionListTaxonomyBadge`'s role for taxonomy codes.

### Standalone `GET /organization`

A separate, tenant-scoped organization typeahead endpoint
(`organizationApiClient.organizationControllerSearch`) also exists and is
wired into `src/lib/api/clients.ts`, but is **not** consumed by the search
dialog (which uses the combined `/suggestion` call above). It's reserved for
a possible future standalone organization-search UI.
