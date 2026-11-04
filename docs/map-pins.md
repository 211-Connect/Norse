# Map pins: every search result on the map

## Purpose

By default the search map shows only the current page of results, so a search
with 489 matches draws about 25 pins, and an agency on a later page looks
unlisted (ISS-1747, P026). With this feature the map shows every result, up to
1,000: the current list page as normal pins, and the rest as numbered clusters
that split into small circles as you zoom in.

## Where it is configured

In Payload: **Resource Directories > Search > Search Settings > Show all results
on the map** (`showAllResultsOnMap`, off by default). It is opt-in per tenant,
because each search then costs a second Elasticsearch query.

The flag only decides whether the frontend asks for pins. `GET /search/pins`
does not check it.

## Architecture

```
/search page (server)
  ├ GET /search         the list, as without the flag
  └ GET /search/pins    in parallel; the page waits up to 2s, cached in Redis
        ↓
SearchResultsProvider { results, pins, totalResults, isTotalCapped }
        ↓
MapContainer
  ├ results → markers   DOM pins with keyboard support
  └ pins - results, grouped by address → points   canvas clusters and circles
```

- **API.** `GET /search/pins` in Norse-API takes the same params as `GET /search`
  and reuses its request builders, so both match the same resources. It drops
  facets, returns only the fields a pin needs and keeps only located resources.
  Hybrid search skips the embedding and taxonomy lookup unless `relevance_cutoff`
  is on: filters alone decide what matches, so ranking only matters past the
  limit, where pins are ordered lexically and can differ from the list.
- **Cache.** Redis for an hour under `search_pins:<tenant>:<locale>:<hash>`.
  `page`, `limit` and `sort` are not sent, so every page of a search shares an
  entry. `coords` are rounded to two decimals (about 1 km) so neighbours share
  one too. They cannot be dropped: they filter by service area even at
  `distance=0`.
- **Timeout.** If pins take longer than 2 seconds the page renders the current
  page's pins only. The request keeps running and fills the cache for the next
  visitor. `findResourcePins` never rejects, so pins cannot break the page.
- **AI classification.** It needs no special handling: results load through
  `GET /search`, so pins use the same request. Pins are skipped only when the
  clarify dialog opens over the page and hides the map.
- **`POST /search`.** Not supported, as it is being removed. With
  `NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG` on, the list and pins
  could disagree.

## Map behavior

- **Clusters** come from MapLibre's clustered GeoJSON source
  (`maplibre/points-layer.ts`), computed in a worker and drawn by the GPU rather
  than as DOM elements, with an 8px click tolerance. Nearby locations (within
  40px) merge up to zoom 14. Clicking a cluster zooms until it splits.
- **Counts are resources, not locations**, summed through `clusterProperties`.
  They leave out the current page, which the list's pins show.
- **Several resources at one address** are a numbered bubble like a cluster, but
  clicking it opens a popup that lists them, as zooming can't split them.
- **Single locations** are small circles.
- **Pins are compact** while circles are shown (72% of normal size) and grow on
  hover and keyboard focus. Without the flag they keep their normal size.
- **A legend** in the map's corner explains pins, the user's location, circles
  and clusters.
- **First load and new searches** fit the central 95% of locations
  (`getCoreExtent`), so a few distant results don't zoom out to the continent.
- **Turning the list's page** swaps which results are pins and leaves the map
  where it is.
- **Pins that fail or time out** leave the map as it is without the flag.

## List cap

With the flag on, the list's count and pagination stop at 1,000 so that the list
and map cover the same results. The count reads `1-25 of 1,000+` when more match,
a `page` past the cap shows the last page, and results past 1,000 can't be
reached. Analytics still receive the real total.

## Accessibility

Circles and clusters can't take keyboard focus, as they are drawn on the canvas. Keyboard and
screen reader users reach the same resources through the paginated list, whose
current page keeps focusable pins.

## Known limits

- Pins are sent with the page, so they add to every page load and list page
  change, even on a cache hit. 965 pins are about 270 KB uncompressed.
- Hybrid search without a taxonomy scope matches the tenant's whole population:
  the query only ranks. Pins then show everything the filters allow, not only
  what is relevant to the query.
