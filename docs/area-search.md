# Area search: searching by place, not by point

## Purpose

Lets a search be scoped to an **area** (state, county, city, ZIP) instead of a
point plus a radius, over plain `GET /search`. It replaces the old split where
GET could only do "centroid + radius" and POST carried a GeoJSON body (used
only by MBOA, behind `NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG`,
and in practice sending a Mapbox **bbox rectangle** for state picks).

It serves three callers with one model:

- the Norse location picker and deep links,
- printable directories (default location of a directory),
- agents and other API clients (Keeper), which only have the user's words
  ("Yakima") and must not need to know Region ids.

## The model: three ways to say where

`GET /search` takes exactly one effective location, chosen by precedence
`region` > `coords` > `location`:

| Caller has | Sends | Behaviour |
| --- | --- | --- |
| a point (address, "use my location") | `coords` + `distance` | unchanged: point search |
| a known area (Norse picker, SEO page, printable directory) | `region=county:53077` (comma list, up to 20) | area search; `distance` ignored; `coords`, if sent, is only the origin for `sort=distance` and hybrid proximity scoring |
| free text (agents) | `location=Yakima` (+ optional `state=WA`) | the API geocodes it and resolves it to a region or a point, then searches as above |

- Norse has always sent `location` as a display label next to `coords`; the
  precedence keeps those requests byte-for-byte the same search.
- When `region` or `location` decided the search, the response carries
  `resolved_location: { input?, regions: [{ id, type, name }], coords? }`
  so a caller can see what was actually searched (`regions` is empty when
  the text resolved to a point, e.g. an address).
- A `location` that can't be resolved (no geocoder hit, or no hit in `state`)
  is a **400**, never a silent nationwide search.

### Region ids

The Region store (`regions` ES index, ADR 0024, loaded by Dagster) is the
source of truth for area shapes and ids:
`state:WA`, `county:53077` (5-digit FIPS), `zip:98901`, `place:<Census place
GEOID>` (cities; seeded separately). The same index is used by every
environment.

## Resolving a geocoder hit to a Region

Mapbox (the geocoder Norse uses) returns a point (`center`), a `place_type`
and a bbox — never a polygon or a Region id. `RegionService.regionOf` maps a
hit to a Region:

| Mapbox `place_type` | Region type |
| --- | --- |
| `region` | `state` |
| `district` | `county` |
| `place` | `place` |
| `postcode` | `zip` |
| `locality`, `neighborhood`, `address`, `poi` | none — point search with `coords` |
| `country` | none — no location filter |

- One `geo_shape` query on `regions` returns every Region containing the
  hit's `center`; the wanted type wins, else the next larger one (place →
  county → state), so an unseeded place searches its county. Mapbox's
  `center` of a county is its seat and of a postcode a point inside it, so
  point-in-polygon is safe for both.
- A Mapbox `region` hit without a US state code (e.g. "Washington
  metropolitan area") stays a point.

It runs in one place: `GET /geocoding/forward` adds `region_id` (null for
points) and `state_code` to every Mapbox hit (`region` was already taken: it
is the state's name), and caches them with the hit. So:

1. The Norse picker already has the Region of what the user picked — no extra
   request, no type mapping in Norse.
2. `GET /search?location=…` geocodes the text the same way, keeps the first
   hit (in `state`, when given) and searches its `region_id` exactly like
   `region=`, or its point when it has none.

An ambiguous name ("Springfield") takes Mapbox's best match; `state=XX`
picks one, and `resolved_location` shows the outcome. The Norse picker lists
the candidates and the user picks one.

## What an area search matches

A resource matches a Region when **either**:

- its `service_area` intersects the Region's shape, or
- its `location.point` lies inside the Region's shape.

Several Regions are OR'ed. Both clauses use `geo_shape` with
`indexed_shape: { index: "regions", id, path }`, so ES reads the shape by id
and no geometry crosses the wire; the request stays a cacheable GET.

- **Union** fixes the gap where resources without `service_area` (up to ~45%
  for some tenants) were invisible to service-area matching.
- Resources with neither field match no area (same as point search today).
- An unknown Region id is a 400.

Measured on one WA tenant (production data): `county:53077` 4,349 results
(today's centroid check: 1,535), 25–750 ms; `state:WA` 15,564, 110–390 ms.

## Norse

- **Picker.** A picked result with a `region` sets the search's region; the
  `/search` URL carries `region` (what is searched), `location` (label) and
  `coords` (origin for distance sort and the map). The `user-pref-*` cookies
  and the middleware fallback carry `region` too.
- **Radius.** The distance select is hidden while a region is set: a region
  is searched as its shape, never buffered.
- **Map.** With a region, the search map draws the Region outline (server
  action `getRegionArea`, `GET /regions/:id`, cached a day in Norse) under the result
  markers and fits to it, instead of the user's pin (also while the outline
  loads). Geometry is not part of the search response: Region shapes are
  simplified (2–40 KB, a state included), but they would be repeated on
  every page and every cached result, and the PDF does not need them.
- **Deep links.** `?location=…` without `coords`: the existing server-side
  forward geocode now also takes `region` from the same result.
- **Printable directories.** A directory's default location can be a region
  (`defaultQueryConfig.regionId`); radius is offered only for point
  locations.
- **Request.** `findResources` sends `region` (and no `distance`) when set,
  and no longer sends the `location` label: the API would geocode a
  `location` that comes without `coords`/`region`.
- **Cookies.** `user-pref-region-id` holds the saved location's Region
  (`user-pref-region` already holds the state's name).
- **Removed.** `findResourcesV2`, `buildSearchRequest`, the advanced-geo env
  flag and the per-render re-geocode. MBOA's state picks become
  `region=state:MN` on the same GET path as every other tenant.

## Caching and Region reseeds

`region_id` is cached with the geocode hits: 7 days in the API
(`geocode:forward:v2:`) and 7 days in Norse (`forward_geocode:`, `v: 2`).
After a reseed that adds Regions (cities), places pick them up as those
entries expire; bump both versions to apply it at once. Outlines are cached
a day in Norse (`region:<id>`).

## `POST /search` deprecation

POST and `geo_type=boundary` stay working but answer with a `Deprecation`
header and are logged per tenant. They are removed once the logs
show no callers for the agreed period. Before removal, check stored
printable-directory sources for a persisted `body` (Norse never writes one).

## Not in scope

- A choice between "physical in area" / "+ virtual" / "serves area" — the
  union above is the single behaviour.
- A radius around an area, or polygon buffering.
- Upgrading old links that carry only `coords` — they keep working as point
  searches.
