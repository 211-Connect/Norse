# Search Deep Link Geocoding

## Purpose

This document explains how the search page handles deep links that arrive
with a human-readable `location` but no `coords` — e.g. shared links, older
bookmarks, or external referrers that only know a place name.

This is a separate flow from the AI classification legacy-link flow (see
[docs/ai-search-legacy-link-flow.md](/docs/ai-search-legacy-link-flow.md)):
it runs for **every** tenant regardless of `search.searchEngine`, and it
concerns the `location`/`coords` params, not `query_type`/`taxonomy`.

## Problem

A search deep link can legitimately include a `location` string (e.g.
`?location=Minneapolis%2C%20MN`) without `coords`. Location-based features —
geo search, sort-by-distance, map rendering, county/place-scoped facets — all
require `coords`. Without a normalization step, a URL like this would render
degraded results (no location-based UI) even though the user clearly supplied
a place.

## Flow

1. **Middleware pass-through** ([src/middlewares/searchLinkCorrectionMiddleware.ts](/src/middlewares/searchLinkCorrectionMiddleware.ts))
   - Runs on every `/search` request.
   - If the URL already has `location` but not `coords`, the middleware
     deliberately does nothing (`return`) and defers to the search page
     component — it does not have geocoding capability itself.
   - Otherwise, it fills in `location`/`coords`/`distance` from the
     `user-pref-*` cookies when the incoming URL doesn't specify them, so a
     returning user's last-used place carries over to a fresh link that has
     no location info at all.
   - Deep links that already specify a `location` are never overwritten by
     the stale cookie — the cookie fallback only applies when the URL has no
     `location` at all.

2. **Server-side forward geocode** ([src/app/(app)/features/search/utils/navigateToSearchWithCoords.ts](/src/app/(app)/features/search/utils/navigateToSearchWithCoords.ts))
   - Called from the `/search` page component when it detects `location` is
     present but `coords` is missing (the case the middleware deferred).
   - Forward-geocodes `searchQuery.location` via `forwardGeocode` (Mapbox).
   - On success: `redirect()`s to the same `/search` path with all original
     params preserved (`qs.stringify(rawParams, ...)`) plus `coords` appended.
   - On failure (no geocode match): logs a warning and continues rendering
     search results without `coords` rather than blocking the page.

## Guardrails

1. This flow must not depend on or interact with AI classification state —
   it runs before/independently of the `query_type`/`taxonomy` gate.
2. Never let a stale location-preference cookie silently override an
   explicit `location` provided on the incoming deep link.
3. Geocode failures must degrade gracefully (render results without
   `coords`), never error the page.
4. Preserve all other incoming search params across the redirect.

## E2E Coverage

[e2e/search-location-geocode.spec.ts](/e2e/search-location-geocode.spec.ts)
covers this flow with two tests, tenant-agnostic (location strings geocode
the same regardless of which tenant's data is being searched):

1. A deep link with `location=Minneapolis, MN` and no `coords` is
   auto-geocoded and results load, with `coords` matching the known
   coordinates for that place.
2. A stale `user-pref-coords`/`user-pref-location` cookie pointing elsewhere
   (Anchorage, AK) does not leak into the geocoded result when the deep link
   specifies a different location (Minneapolis, MN) — the redirect uses the
   deep link's location, not the cookie.
