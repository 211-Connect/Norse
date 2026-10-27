# Area search — tickets

Design: [area-search.md](/docs/area-search.md). Order: T1 and T2–T4 in
parallel (all additive), then T5–T7, then T8 after the deprecation window.

---

## T1 — Dagster: interior Region shapes (`geometry_interior`)

**Status:** not started (Dagster repo not in this workspace).

**Repo:** dagster-data-orchestration (regions loader)

Why: `intersects` against the full Region shape matches services whose area
only overlaps the edge. Service areas and Regions come from different,
separately simplified boundary sources, so a neighbouring county's services
overlap by up to ~1 km. Measured on the WA tenant (2026-10-27), searching
"Tacoma" (Pierce County): 5,862 of 7,568 results are located outside the
county, and 4,998 of those cover neither downtown Tacoma nor the county's
middle (e.g. Seattle after-school programs, a Bothell senior center).

Simulated with the county shrunk before matching (`service_area` only; the
location clause keeps the full shape):

| Region | full | −100 m | −500 m | −1 km | −2 km |
| --- | --- | --- | --- | --- | --- |
| Pierce, located outside | 5,862 | 5,460 | 4,240 | 947 | 899 |
| Yakima, located outside | 3,298 | — | — | 715 | 715 |

Both level off at 1 km; what is left serves the county (statewide or
multi-county services with an office elsewhere).

- Add `geometry_interior` (`geo_shape`) to every Region: `geometry` buffered
  by **−1 km** (in an equal-area projection, e.g. EPSG:5070, then back to
  WGS84), normalized with the same policy as `geometry`.
- If the buffer is empty or loses most of the shape (small ZIPs, `point_like`
  ones), store `geometry` unchanged — e.g. keep the buffer only when it holds
  at least half the area.
- New versioned index + alias swap (publish-before-delete, #604); the index is
  shared by all environments.

Acceptance

- [ ] Every Region has a non-empty `geometry_interior`.
- [ ] Spot check: Pierce County (`county:53053`) on the WA tenant drops to
      about 950 results located outside; `zip:63110` and Jackson County, MO
      unchanged in id and name.
- [ ] Norse-API switches `REGION_SERVICE_AREA_PATH` to `geometry_interior`
      (one constant) after the alias swap.

---

## T2 — Norse-API: geocoder hit → Region

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

## T3 — Norse-API: forward geocoding returns `region_id` and `state_code`

**Status:** implemented on `feat/area-search` (Norse-API).

- Every Mapbox hit of `GET /geocoding/forward` gains `state_code` (from the
  region context `short_code`, `US-WA` → `WA`) and `region_id` (T2; null for
  points), cached with the hit (key `geocode:forward:v2:`). OpenCage
  unchanged.

Acceptance

- [x] "Yakima" → `region_id: county:53077` (or the place once seeded).
- [x] SDK regenerates cleanly.

---

## T4 — Norse-API: `region`, `location`, `state` on `GET /search`

**Status:** implemented on `feat/area-search` (Norse-API), unit-tested, verified on localhost against production ES data.

- `region`: 1–20 Region ids, pattern-validated, existence checked with one
  `mget` (400 lists unknown ids). Filter per Region: `service_area`
  intersects `indexed_shape(regions, id, REGION_SERVICE_AREA_PATH)` OR
  `location.point` inside `indexed_shape(regions, id, geometry)`. `distance`
  ignored; `coords` only the origin for sort and hybrid proximity.
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

## T5 — Norse-API: public `GET /regions/:id` and printable-directory default region

**Status:** implemented on `feat/area-search` (Norse-API).

- Public, versioned, tenant header required (AGENTS tenant rule):
  `{ id, type, name, state, centroid?, geometry, … }`.
- `defaultQueryConfig.regionId` (validated by pattern). When set,
  `withDefaultQueryParams` adds `region` (and not `distance`) to query
  sources that have no `region`/`coords` of their own.

Acceptance

- [ ] 404 for a well-formed unknown id, 400 for a malformed one.
- [ ] A directory with `regionId` renders its PDF scoped to the Region.

---

## T6 — Norse: picker, URL, search request, map

**Status:** implemented on `feat/area-search` (Norse), verified in the browser on localhost (WA tenant); e2e `search-geocode` + `search-dialog-location` pass locally.

- Regenerate SDK. `GeocodeResult` gains `region`, `state_code`.
- Picker commit stores `searchRegion`; URL/`parseSearchParams`/`buildSearchUrl`
  carry `region`; cookies + middleware fallback carry it.
- `findResources` sends `region` (and no `distance`) when set.
- Deep link geocode (`navigateToSearchWithCoords`) adds `region`.
- Distance select hidden with a region.
- Map: with a region, draw the outline from `GET /regions/:id` and fit bounds;
  no pin/circle.
- Delete the V2/boundary path and the advanced-geo env flag.

Acceptance

- [ ] Picking "Yakima County, WA" → URL has `region=county:53077`, radius
      hidden, map shows the county.
- [ ] Picking an address → unchanged point search.
- [ ] `e2e/search-location-geocode.spec.ts` still passes; add an area case.

---

## T7 — Norse: printable directories default region

**Status:** implemented on `feat/area-search` (Norse), unit-tested; UI not exercised (needs a signed-in user).

- Wizard and edit dialog store `regionId` from the picker; radius only for
  point locations; `withDefaultQueryParams`/`matchesDefaultLocation` know
  `region`.

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
  and `resolved_location`; T4 adds the docs.
- **Cities in the Region store:** still needed for `place:` Regions (with
  centroid). Its "pass geometry through POST /search" path is replaced by
  `region=place:…`.
