# Location / geo search flow

How location and geospatial search work in the search frontend
(`src/app/(app)/shared`). The frontend builds params/body; the Norse API does the
geocoding proxy and the spatial query.

## 1. Location input UI & "Add my location"

- **Typed address**: the location input feeds `useLocations`
  ([use-locations.ts](../../src/app/(app)/shared/hooks/api/use-locations.ts)),
  which autocompletes via `MapService.forwardGeocode`. Selecting a result stores
  `searchLocation`, `searchCoordinates`, `searchPlaceType`, `searchBbox` in
  `searchAtom`.
- **Geolocation ("Use my location")**:
  [use-my-location-button.tsx](../../src/app/(app)/shared/components/search/use-my-location-button.tsx)
  calls `navigator.geolocation.getCurrentPosition` (high accuracy, 5s timeout),
  reverse/forward geocodes, then writes the same atom fields + sets cookies via
  `setLocationCookies`. On failure it toasts `search.geocoding_*` messages.

### Location field: typing → suggestion box → select → encode

The field is `location-search-bar.tsx` wrapping the `Autocomplete` UI
([location-search-bar.tsx](../../src/app/(app)/shared/components/search/location-search-bar.tsx)):

1. **Type**: `handleInputChange` sets `shouldSearch` and stores the raw text in
   `prevSearchLocation`. A debounced value feeds `useLocations`, which queries
   `forwardGeocode` (limit 5) once length > 0. Results show in a suggestion
   dropdown plus a synthetic "Everywhere" option. While fetching, stale geocoded
   options are suppressed so Enter/Tab can't commit a stale address.
2. **Select**: choosing a suggestion calls `setSearchLocation` → `findCoords`
   matches the label to a `GeocodeResult`. On a valid hit it stores
   `searchCoordinates`, `searchPlaceType`, `searchBbox`, sets location cookies;
   unrecognized text → coords cleared, cookies wiped. "Everywhere" / clear resets
   coords (search everywhere).
3. **Encode**: coords become `coords=lon,lat`; the typed label is sent as
   `location` and surfaces in the URL/`query_label`. `place_type`+`bbox` drive
   boundary vs proximity (sections 3–4). So the field stores both a display string
   and the resolved coords, and only the coords/bbox are encoded into the request.

## 2. Geocoding

- Service: `MapService.forwardGeocode` →
  [forwardGeocode.ts](../../src/app/(app)/shared/serverActions/geocoding/forwardGeocode.ts)
  → `GET {API_URL}/geocoding/forward?address&locale&limit=5[&provider]`.
- Providers: `mapbox` | `opencage`. Reverse geocode uses `opencage`.
- Response shape `GeocodeResult[]`
  ([resource.ts](../../src/types/resource.ts#L50)): `coordinates` ([lon,lat]),
  `place_type`, `bbox`, `postcode`, `district`, `region`, `address`.
- Default map center: maplibre map uses `center ?? undefined`, `zoom 7`
  ([map.tsx](../../src/app/(app)/shared/components/map/maplibre/map.tsx#L100-L106));
  center comes from tenant config / first marker, not hardcoded.

## 3. Params passed to search

Built in `buildSearchRequest`
([search-utils.ts](../../src/app/(app)/shared/lib/search-utils.ts#L83)):

- `coords` = `searchCoordinates.join(',')` when 2 coords present.
- `distance` = `searchDistance` or `'0'`.
- `location` / `query_label` from store.
- `geo_type` = `boundary` only in boundary mode; otherwise proximity (no flag).

Classic path uses GET `findResources` → `findResourcesOrigin`; advanced path uses
POST `findResourcesV2` ([search-service.ts](../../src/app/(app)/shared/services/search-service.ts#L266)).

## 4. POST `/search` GeoJSON boundary body

`shouldUseBoundarySearch` returns true when: advanced-geo flag on, valid 4-num
`bbox`, and `place_type` is `region`/`country`. Then `bboxToPolygon` (Turf
`bboxPolygon`) makes a Polygon and sends `{ geometry }` with `geo_type=boundary`.
Otherwise proximity: `{ coords, distance }`, empty body. Region selection comes
from the geocode `bbox`.

## 5. Distance, units, sort

- Units: **miles**. Options from `appConfig.search.radiusOptions`, default
  `[15,30,45]` ([distance-select.tsx](../../src/app/(app)/shared/components/search/distance-select.tsx#L46-L53)).
  Persisted in `user-pref-distance` cookie.
- `distance` defaults to `'0'` (no radius cap) when none set.
- Sort: `getSortOption` returns `distance` when coords exist, else `relevance`;
  hybrid hides sort.

## 6. User coords & per-result distance

- `userCoordinatesAtom` ([search.ts](../../src/app/(app)/shared/store/search.ts#L20))
  holds device coords; `buildSearchLocationPayload` adds zip/county.
- Per-result distance: `distanceBetweenCoordsInMiles` (Haversine, R=6371km ×0.621371)
  ([utils.ts](../../src/app/(app)/shared/lib/utils.ts#L113)) between user coords and
  `result.location.coordinates`, shown in `MapPopup`.
