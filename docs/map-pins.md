# Map pins: every search result on the map

## Purpose

By default the search map shows only the current page of results, so a search
with 489 matches draws about 25 pins, and an agency on a later page looks
unlisted (ISS-1747, P026). With this feature the map shows every result, up to
1,000, as small circles: the current list page in the tenant's primary colour,
and the rest in a solid tint of it, halfway to white.

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
  ├ pins + results, grouped by address → points   canvas circles
  └ the list's points → markers   invisible DOM targets for the keyboard
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

- **Circles** are a MapLibre `circle` layer (`maplibre/points-layer.ts`), drawn
  by the GPU rather than as DOM elements, with an 8px click tolerance.
- **Circles are the same size** whether or not they're in the list. Only the
  colour differs, and the list's are drawn on top. They grow with the zoom and on
  hover.
- **Several resources at one address** share a circle, whose popup lists them
  without scrolling, moving the map to fit, unless the list is taller than the map.
  Its count shows from zoom 9, where the circle is big enough to hold it, and hides
  while a circle above covers it. An address counts as in the list if any of its
  resources is.
- **Clicking a circle in the list** scrolls the list to that result.
- **A legend** in the map's corner explains the two circles and the user's location.
- **First load and new searches** fit the central 95% of locations
  (`getCoreExtent`), so a few distant results don't zoom out to the continent.
- **Turning the list's page** recolours the circles and leaves the map where it
  is.
- **Pins that fail or time out** leave the map as it is without the flag.
- **A map that crashes** never replaces the page. It retries with the current
  page's pins only, then shows a message beside the list, and tries again on the
  next results. Each crash is still reported through the error webhook.
- **No located results** leave the map on the user's location, or on the tenant's
  default view without one.

## List cap

With the flag on, the list's count and pagination stop at 1,000 so that the list
and map cover the same results. The count reads `1-25 of 1,000+` when more match,
a `page` past the cap shows the last page, and results past 1,000 can't be
reached. Analytics still receive the real total.

## Accessibility

Circles can't take keyboard focus, as they are drawn on the canvas. Each circle
on the list's current page has an invisible DOM marker over it, which takes focus,
shows a focus ring and opens the same popup. The other circles have none: keyboard
and screen reader users reach them by turning the list's page.

## Known limits

- Pins are sent with the page, so they add to every page load and list page
  change, even on a cache hit. 965 pins are about 270 KB uncompressed.
- Hybrid search without a taxonomy scope matches the tenant's whole population:
  the query only ranks. Pins then show everything the filters allow, not only
  what is relevant to the query.
