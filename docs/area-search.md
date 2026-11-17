# Area search

Picking an area in the location field (a state, county, city or ZIP) searches
that area's shape. Picking an address, or a place the regions index doesn't
have yet, searches a radius around a point, as before.

The filter itself (Region ids, match modes, the `regions` index, what each
mode returns) is the Norse API's: see `docs/area-search.md` in Norse-API. This
doc covers what Norse sends, stores and draws.

## Where it's configured

Payload → Resource Directories → **Search** tab → Search settings:

| Field (label starts "Area search:")              | Default              | Meaning                                                            |
| ------------------------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `areaMatchMode` — which resources count as in the area | `located_or_serving` | What "in the area" means; see the modes below.                     |
| `includeUnlocatedInAreaSearch`                    | off                  | Also return resources with neither a location nor a service area. |

Columns: `search_search_settings_area_match_mode` and
`search_search_settings_include_unlocated_in_area_search` (migration
`20261117_105248_area_search_settings`, additive).

Both reach the app as `appConfig.search.areaMatch` /
`appConfig.search.includeUnlocatedInAreaSearch`, and the API as
`search_config.area_match` / `include_unlocated_in_area_search` in Redis
(`buildHybridSearchConfigCache`). Visitors get no control for them.

| `area_match`         | resource with a location     | resource without a location   |
| -------------------- | ---------------------------- | ----------------------------- |
| `located`            | location inside the area     | left out                      |
| `located_or_serving` | location inside the area     | service area overlaps it      |
| `serving`            | inside, or service area overlaps | service area overlaps it  |

## Flow

```text
location field commit (location-search-bar.tsx)
  geocode hit.region_id ── e.g. county:53033, from GET /geocoding/forward
    → searchRegion atom, user-pref-region-id cookie
/search URL               location, coords, region     (no distance with region)
search page               toFindResourcesQuery → withAreaSettings
  GET /search             region, area_match, include_unlocated, coords
  GET /search/pins        same params (PINS_PARAMS)
search map                useRegionArea(region) → /api/region-area → GET /regions/:id
                          outline under the circles, view fits it, no user pin
```

- **Which hits are areas.** The API sets `region_id` on Mapbox `region`,
  `district`, `postcode` and `place` hits it can match to the regions index.
  Everything else (addresses, POIs, cities not seeded yet, OpenCage) has no
  `region_id` and stays a point search.
- **URL.** `region` is a slot of the search intent (`intent/slots.ts`).
  `applyWriterRules` writes it only with a location and a valid id, and drops
  `distance` when it is set. `coords` stay: they are the distance-sort origin.
- **Radius.** The distance select hides while `searchRegion` is set; the API
  ignores `distance` with `region` anyway.
- **Deep links.** `?location=…` with no coords is geocoded on the server
  (`navigateToSearchWithCoords`); a hit with `region_id` also gets `region`. A
  URL with `region` and no coords is searched as is.
- **Returning visitors.** `user-pref-region-id` is restored with the location
  by `searchLinkCorrectionMiddleware` and `search-state-sync`, and only with
  it: a URL with its own location never takes the cookie's region.
- **Map.** `region` comes from the search results context (what the server
  searched), not the atom (what is typed). `/api/region-area` caches the
  outline in Redis for a day under `region_area:<id>` (boundaries are the same
  for every tenant) and in the browser for a day. On failure the map frames
  the results as before.

## Printable directories

The default location stores `defaultQueryConfig.regionId` when the picked
place has one, and an optional `areaMatch` (null: the site default). With a
region the radius field is replaced by a "Resources in this area" select,
and no radius is saved. Query sources saved from an area search store
`region` with their `coords` and no `distance`.

`withDefaultQueryParams` mirrors the API: the directory's region applies to
sources with neither `region` nor `coords`, and no radius is added then.
`getLocationConflict` / `matchesDefaultLocation` compare region ids when both
sides have one.

## Removed

`POST /search` (`findResourcesV2`, `buildSearchRequest`, the bbox rectangle)
and `NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG`, which only MBOA
had on. MBOA area picks now use `region` like every tenant.
