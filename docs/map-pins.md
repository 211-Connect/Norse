# Map pins: every search result on the map

## Purpose

By default the search map shows only the current page of results, so a search
with 489 matches draws about 25 pins, and an agency on a later page looks
unlisted (ISS-1747, P026). With this feature the map shows every result, up to
10,000, as small circles: the current list page in the tenant's primary colour,
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
  └ toPinsQuery         the pins request, without page, limit or sort
        ↓
SearchResultsProvider { results, pinsQuery, totalResults, isTotalCapped }
        ↓
MapContainer
  ├ useSearchPins → GET /api/search-pins (Norse) → GET /search/pins (Norse-API)
  ├ pins + results, grouped by address → points   canvas circles
  └ the list's points → markers   invisible DOM targets for the keyboard
```

- **API.** `GET /search/pins` in Norse-API takes the same params as `GET /search`
  and reuses its request builders, so both match the same resources. It drops
  facets, returns only the fields a pin needs and keeps only located resources.
  Hybrid search skips the embedding and taxonomy lookup unless `relevance_cutoff`
  is on: filters alone decide what matches, so ranking only matters past the
  limit, where pins are ordered lexically and can differ from the list.
- **Client fetch.** The page renders the list without waiting for pins and
  passes the map a query string (`toPinsQuery`). The map fetches it from
  `/api/search-pins` with React Query, showing "Loading all locations…" as the
  legend's last row. The page's own results are circles from the
  first render, so nothing changes shape when the rest arrive. The route takes the tenant from the host, never the
  query, keeps only the params a search matches on (`parsePinsQuery`), and has
  Arcjet bot protection like the search page (`isRouteDenied`, see
  [bot-protection.md](bot-protection.md)).
- **Cache.** Three levels, all keyed without `page`, `limit` and `sort`, so every
  page of a search shares them: React Query in memory (fresh for an hour, kept
  5 minutes after the last search that used it), the browser
  (`Cache-Control: private, max-age=3600`) and Redis for 6 hours under
  `search_pins:<tenant>:<locale>:<hash>`, an empty result included (a failure
  is never cached). Search results stay in Redis for an hour, so after a data
  import the map can lag the list by up to 5 hours. Turning the list's page sends no pins
  request at all, and neither does a search whose results all fit on its first
  page: the map then draws its circles from the page alone. `coords` are rounded to two decimals (about 1 km) so neighbours share
  one too. They cannot be dropped: they filter by service area even at
  `distance=0`.
- **No timeout.** Pins never hold up the page, so there is no wait to cut
  short. Until they arrive, and if they fail (after one retry), the map shows
  the current page's results as circles, with the legend. A new search drops the
  previous search's pins straight away rather than colouring them for the new
  list.
- **AI classification.** It needs no special handling: results load through
  `GET /search`, so pins use the same request. Pins are skipped only when the
  clarify dialog opens over the page and hides the map.
- **Area search.** Pins take the same `region`, `area_match` and
  `include_unlocated` as the list, so they show the same resources; the map
  draws the area's outline under them (see docs/area-search.md).

## Map behavior

- **Circles** are MapLibre `circle` layers (`maplibre/points-layer.ts`),
  drawn by the GPU at their own size, so their edges stay smooth at every zoom,
  with an 8px click tolerance. From zoom 10 a shared address's circle turns
  transparent and an icon takes its place: the circle with its count drawn in,
  centred on the digits, drawn on a canvas at the size it shows (9px or 11px
  radius, at the screen's pixel density) the first time the map asks for it
  (`styleimagemissing`). Text in its own layer would draw above every circle;
  the icons sit above their own colour's circles (larger counts stack higher
  anyway) and below the next colour's, so a list circle covers a light count.
  An icon scaled far from its drawn size blurs and loses its round edge, which
  is why single circles aren't icons. Three sources: every location, light, uploaded once per
  search; the list's current page, dark, drawn above it; and the hovered circle
  and the one whose popup is open, drawn larger above both. Turning the page
  re-uploads only the page's locations; the rest stay while they're the same
  places, checked by an order-independent signature (`toPlacesSignature`)
  rather than by sorting. A circle is known by its place (`toPlaceKey`), as a
  shared address's first result changes with the page.
- **Popups are built when they open** (`MarkerDef.getPopup`), not for every one
  of 10,000 circles on each page change.
- **Circles are the same size** whether or not they're in the list. Only the
  colour differs, and the list's are drawn on top. They grow with the zoom, from
  3px radius at zoom 5 to 10px at 14, so a zoomed-out state shows where results
  are dense rather than one blot. They grow 2px on hover and 3px while their popup
  is open (`setSelectedPlace`), drawn again above all others.
- **Circle colours.** The list's: the primary with a white ring. The rest: the
  primary halfway to white with a primary ring, which keeps them visible on a
  light basemap, and 55% opaque at zoom 5, solid from 9, so overlapping circles
  read darker where results are dense. Rings are a share of the radius, so they
  grow with the circle.
- **Several resources at one address** share a circle, whose popup lists them
  without scrolling, moving the map to fit, unless the list is taller than the map.
  Below zoom 10 the circle has a second one just behind it, so it reads as a
  stack. From zoom 10 (city level) it shows its count instead, and is at least
  9px in radius (11px for `99+`, above 99) so the digits fit. On a light circle
  the count is the primary nearly halfway to black (white there is only about
  2:1), on a list circle the primary's foreground colour. Larger counts stack
  higher within each colour, so a shared address sits above single resources.
  An address counts as in the list if any of its resources is, and its popup
  marks those resources with the same dark dot and a faint tint, listing them
  first.
- **Clicking a circle in the list** scrolls the list to that result, just below
  the header when the tenant's header is sticky.
- **A legend** in the map's corner explains the two circles, the count on a shared
  address and the user's location, each row only when the map shows it. Below
  `lg`, where the map is 320px high, it stays folded behind a "Map legend"
  button, which shows a spinner while the rest of the circles load.
- **First load and new searches** fit the central 95% of locations
  (`getCoreExtent`), so a few distant results don't zoom out to the continent.
- **Turning the list's page** recolours the circles and leaves the map where it
  is.
- **Every result on the list's page is on the map**, dark, even if the pins
  leave it out: the page's results come from `GET /search` and go in first, and
  pins with the same id are dropped. Results without coordinates have no circle.
- **Pins that are loading or fail** leave the page's circles on their own.
  Without the flag the map keeps its classic pins.
- **A map that crashes** never replaces the page. It retries with the current
  page's pins only, then shows a message beside the list, and tries again on the
  next results. Each crash is still reported through the error webhook.
- **No located results** leave the map on the user's location, or on the tenant's
  default view without one, and show no legend.
- **Pins arriving after the reader has used the map** (a drag, wheel, tap or key
  on it) add their circles without refitting, so the map doesn't move under
  them. Otherwise the map fits the whole search once the pins arrive.

## Testing

`e2e/search-map-pins.spec.ts` (project `map-pins`) runs an empty search on
tenants whose fixture has `mapPins` set. The canvas has no DOM, so each time the
map settles (`idle`) it writes `data-zoom`, `data-shown-places` and
`data-shown-counts` (`describeShownPoints`) on its `search-map` container, and
each list circle's focus target is a `map-point` with `data-resources`. The
legend is `map-legend`, its loading row `map-legend-loading`, a shared address's
popup `map-site-popup` with `map-site-popup-resource` links, a single
resource's popup `map-popup` with its `map-popup-resource` button. One scenario
ends on a shared address's list, the other on a single resource's button.

## List cap

With the flag on, the list's count and pagination stop at 10,000 so that the list
and map cover the same results. The count reads `1-25 of 10,000+` when more match,
a `page` past the cap shows the last page, and results past 10,000 can't be
reached. Analytics still receive the real total.

## Accessibility

Circles can't take keyboard focus, as they are drawn on the canvas. Each circle
on the list's current page has an invisible DOM marker over it, which takes focus,
shows a focus ring and opens the same popup. The other circles have none: keyboard
and screen reader users reach them by turning the list's page.

## Known limits

- Pins arrive after the list, so the first view of a search shows the page's
  circles first and the others a moment later. 965 pins are about 270 KB
  uncompressed, so 10,000 would be about 2.8 MB, once per search.
- Hybrid search without a taxonomy scope matches the tenant's whole population:
  the query only ranks. Pins then show everything the filters allow, not only
  what is relevant to the query.
