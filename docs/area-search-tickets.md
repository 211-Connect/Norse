# Area search — tickets

Design: [area-search.md](/docs/area-search.md). Order: T1–T4 (Norse-API, all
additive), then T5–T6 (Norse), T7 whenever cities are ready, then T8 after
the deprecation window.

---

## T1 — Norse-API: geocoder hit → Region

**Status:** implemented on `feat/area-search` (Norse-API), unit-tested, verified on localhost.

- `RegionService.regionOf(hit)`: Mapbox `region`→state (only with a US state
  code), `district`→county, `place`→place, `postcode`→zip; anything else is
  a point. One `geo_shape` point query on `regions`; the wanted type, else
  the next larger (place → county → state).
- `REGION_ID_PATTERN` accepts `place:<7 digits>`.

Acceptance

- [x] Unit tests for every `place_type`, metro areas and the fallback.
- [x] Seattle → `county:53033` while no place exists; `place:…` once seeded,
      without code change.

---

## T2 — Norse-API: forward geocoding returns `region_id` and `state_code`

**Status:** implemented on `feat/area-search` (Norse-API).

- Every Mapbox hit of `GET /geocoding/forward` gains `state_code` (from the
  region context `short_code`, `US-WA` → `WA`) and `region_id` (T1; null for
  points), cached with the hit (key `geocode:forward:v2:`). OpenCage
  unchanged.

Acceptance

- [x] "Yakima" → `region_id: county:53077` (or the place once seeded).
- [x] SDK regenerates cleanly.

---

## T3 — Norse-API: `region`, `location`, `state` on `GET /search`

**Status:** implemented on `feat/area-search` (Norse-API), unit-tested, verified on localhost against production ES data.

- `region`: 1–20 Region ids, pattern-validated, existence checked with one
  `mget` (400 lists unknown ids). Filter per Region: `service_area`
  intersects the Region's shape OR `location.point` inside it
  (`indexed_shape(regions, id, geometry)`). `distance` ignored; `coords`
  only the origin for sort and hybrid proximity.
- `location` (+ `state`): ignored with `region`/`coords`; geocode (Mapbox),
  first hit in `state`; its `region_id` is searched like `region=`, else its
  point with the request's `distance`. No hit → 400.
- `resolved_location` when `region` or `location` decided the search.
- Region ids join the search fingerprint only when present.
- `POST /search`: `Deprecation` header, warn log with tenant id.

Acceptance

- [x] `region=county:53077` returns the union; unknown id → 400.
- [x] `location=Yakima` → `resolved_location.regions[0].id = county:53077`;
      `location=21021&state=MD` never resolves outside MD.
- [x] Requests without `region`/`location` are unchanged.

---

## T4 — Norse-API: public `GET /regions/:id` and printable-directory default region

**Status:** implemented on `feat/area-search` (Norse-API).

- Public, versioned, tenant header required (AGENTS tenant rule):
  `{ id, type, name, state, centroid?, geometry, … }`.
- `defaultQueryConfig.regionId` (validated by pattern). When set,
  `withDefaultQueryParams` adds `region` (and not `distance`) to query
  sources that have no `region`/`coords` of their own.

Acceptance

- [x] 404 for a well-formed unknown id, 400 for a malformed one.
- [ ] A directory with `regionId` renders its PDF scoped to the Region
      (unit-tested; not exercised end to end).

---

## T5 — Norse: picker, URL, search request, map

**Status:** implemented on `feat/area-search` (Norse), verified in the browser on localhost (WA tenant); e2e `search-geocode` + `search-dialog-location` pass locally.

- Regenerate SDK. `GeocodeResult` gains `region_id`, `state_code`.
- Picker commit stores `searchRegion`; URL/`parseSearchParams`/`buildSearchUrl`
  carry `region`; cookies + middleware fallback carry it.
- `findResources` sends `region` (and no `distance`) when set.
- Deep link geocode (`navigateToSearchWithCoords`) adds `region`.
- Distance select hidden with a region.
- Map: with a region, draw the outline from `GET /regions/:id` and fit bounds;
  no pin/circle.
- Delete the V2/boundary path and the advanced-geo env flag.

Acceptance

- [x] Picking "King County, WA" → URL has `region=county:53033`, radius
      hidden, map shows the county.
- [x] Picking an address → unchanged point search.
- [x] `e2e/search-location-geocode.spec.ts` still passes.
- [ ] An e2e case for an area pick.

---

## T6 — Norse: printable directories default region

**Status:** implemented on `feat/area-search` (Norse), unit-tested; UI not exercised (needs a signed-in user).

- Wizard and edit dialog store `regionId` from the picker; radius only for
  point locations; `withDefaultQueryParams`/`matchesDefaultLocation` know
  `region`.

---

## T7 — Seed city Regions

**Status:** not started. Covered by the colleague's "Add cities to the Region
store" ticket; only the part below is needed for area search.

- Load `place:<7-digit Census GEOID>` Regions (cities) into the `regions`
  index, with `name`, `state`, `centroid` and `geometry`, like counties.
- Nothing to change in Norse or Norse-API: `regionOf` already prefers a
  `place` Region over the county fallback.
- After the load, bump the geocode cache keys so picks resolve to cities at
  once: `geocode:forward:v2:` in Norse-API `geocoding.service.ts` and `v` in
  Norse `forwardGeocode.ts` (otherwise they switch as entries expire, ≤7
  days).

Acceptance

- [ ] "Tacoma" → `region_id: place:5370000`; the map outlines the city, not
      Pierce County.
- [ ] `GET /regions/place:5370000` returns the city boundary.

---

## T8 — Norse-API: remove `POST /search`

**Status:** waiting for the deprecation window (POST now logs and sends `Deprecation: true`).

After the deprecation window with no logged callers:

- Remove the POST handler, `SearchResourcesBodyDto`, `geo_type=boundary`,
  the printable-directory `body` field (after checking stored sources).

---

## Related tickets (colleague's)

- **Forward geocoding bbox:** superseded — `state` filtering on `/search`
  covers "21021, MD".
- **Coherent geospatial model for agents:** answered by the three patterns
  and `resolved_location`; T3 adds the docs.
- **Cities in the Region store:** see T7. Its "pass geometry through POST
  /search" path is replaced by `region=place:…`.
