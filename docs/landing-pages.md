# SEO landing pages

A landing page is an indexable page for one topic in one place, such as "Food
pantries in Tacoma, WA" at `/food-pantries/tacoma-wa`. Each tenant chooses its
regions and topics in Payload. Norse generates a page for every region × topic
pair, in every locale the tenant has enabled, and lists each page in the
sitemaps so search engines find it.

**Status: designed, not built.** This doc is the design the tickets implement.
Update each section as its ticket lands, and remove this note once everything
is built.

| Piece | Ticket |
| --- | --- |
| Region list endpoint (Norse-API) | ISS-2859 |
| Collections and CMS bridge | ISS-2860 |
| Generation job | ISS-2861 |
| Warm-up and count job, count report | ISS-2862 |
| Tenant → SEO tab | ISS-2863 |
| Landing Pages tab, flag and region picker | ISS-2295 |
| Topics | ISS-2864 |
| Templates, previews, page list and editor, Apply changes | ISS-2865 |
| Landing page route | ISS-2296 |
| XML sitemap | ISS-2299 |
| HTML sitemap and footer link | ISS-2300 |
| Analytics | ISS-2301 |
| This doc and e2e | ISS-2866 |

Out of scope: organization pages (ISS-2675), results chosen by SUNE need code
(ISS-2668), pages made from any search intent (ISS-2686), the canonical tag on
matching `/search` URLs (ISS-2671), and resource pages in the sitemap
(ISS-2679). The sitemap index leaves room for resource pages.

## Where it is configured

Settings are split by who edits them and what they apply to.

**Tenant → SEO** (the `seo` group; super-admin and support): settings for a
host.

| Field | Meaning |
| --- | --- |
| `seo.noindex` | Keeps the host out of search engines. When it is on, the host serves no landing pages and no sitemaps. |
| `seo.sitemap` | Whether the host serves `/sitemap.xml` and `/sitemap`. On by default. |
| `seo.canonicalHost` | The host used in canonical tags, hreflang links and sitemap URLs. Must be one of the trusted domains; empty means the first trusted domain. Read through `tenantCanonicalHost` (`src/utils/canonicalHost.ts`) and `appConfig.canonicalHost`. |
| `seo.searchConsoleProperty` | The Search Console property (`sc-domain:…` or `https://…/`) the analytics import reads. Ownership is verified by the deployment-wide `GOOGLE_SITE_VERIFICATION` token, so there is no per-tenant token. |
| Crawler policy | Bot catalog overrides (ISS-2674), to be added to this group. |

**Resource Directory → Landing Pages tab**: content, edited by tenant admins.
Every field is hidden until a super-admin turns on
`featureFlags.enableLandingPages`, the same pattern as printable directories.
Each tenant has its own Resource Directory.

- Summary card: live pages, locales, when pages were last generated and last
  counted, a link to the page list, and **Apply changes**.
- Regions: a state › county › city tree.
- Topics: the `landing-page-topics` records.
- Copy templates for each locale.

A host serves landing pages and sitemaps only when its Resource Directory has
the flag on and the Tenant is not `noindex`.

## Regions

The picker loads a state's counties and cities from Norse-API
`GET /internal/regions?state=XX&type=county|place`, through the generated SDK
and cached for a day. Each entry has `id`, `type`, `name`, `state`, `countyId`
(cities only: the county containing the city's centroid) and `population`
when the Census data includes it. The admin picks one or more states, then
ticks counties and cities. The tree has "select all" buttons, and cities are
sorted by population.

- A selected state always gets its state pages. The state itself can't be
  unticked.
- ZIP codes are not offered.
- The selection is saved as an **explicit list** of region ids, with name,
  type, state and `countyId` copied in. "Select all" ticks what the index holds
  now. A city added to the index later shows up as "N new cities available"
  and gets pages only after someone ticks it. Pages never appear or disappear
  just because the region index changed.

Cities are loaded for Washington first and will cover every US state, so
nothing here assumes Washington.

## Topics

A landing-page topic is its own record in `landing-page-topics`, created from:

- a topic-card subtopic (taxonomy or text; link subtopics have no search and
  can't be used),
- a search suggestion, or
- a custom query (free text, or taxonomy codes).

The topic keeps a **copy** of its search (`queryType` plus `query` or codes)
and a reference to its source. If the source subtopic or suggestion later
changes or is deleted, the editor shows a warning and nothing changes
automatically. "Re-copy from source" updates the search on request.

The name and slug are localized. The `translate` job fills them for every
tenant locale from the source name, and the admin can edit them. Slugs are
lower-case ASCII: accents are dropped (`alimentación` → `alimentacion`). A
name in a non-Latin script (Chinese, Arabic, Russian…) has no ASCII slug, so
that locale uses the default locale's slug; the page is still in that
language. Slugs are checked against reserved first segments (route folders
and locale codes, `RESERVED_TOPIC_SLUGS` in
`features/landing-pages/lib/slugs.ts`); `tests/landing-pages-slugs.test.ts`
fails when a new route folder is missing from that list.

## URLs

```
/{topic-slug}/{place-slug}           default locale (no prefix)
/{locale}/{topic-slug}/{place-slug}  other locales
```

| Page | English | Spanish |
| --- | --- | --- |
| State | `/food-pantries/washington` | `/es/bancos-de-alimentos/washington` |
| County | `/food-pantries/pierce-county-wa` | `/es/bancos-de-alimentos/pierce-county-wa` |
| City | `/food-pantries/tacoma-wa` | `/es/bancos-de-alimentos/tacoma-wa` |

- **Topic first.** The URL then follows the page hierarchy (topic → state →
  county → city), which is what breadcrumbs and the HTML sitemap show, and
  `/food-pantries` works as a hub URL. It sends a 308 to the state page when
  the tenant covers one state, and lists its state pages otherwise.
- **Topic slugs are translated; place slugs are not.** Place names are proper
  nouns. Counties are `{name}-county-{st}`, cities `{name}-{st}`, and states
  use their full name. These rules keep Spokane city and Spokane County apart,
  and same-named cities in different states. If two places in one state still
  produce the same slug, the county is added.
- **No route prefix.** The host is already `search.…`, so a prefix would add
  nothing in search results. The route is `[locale]/(rest)/[topic]/[place]`.
  Static routes win over it, so a topic slug must never equal an app route's
  folder name. The CMS rejects reserved first segments, and a unit test reads
  the folder names under `src/app/(app)/[locale]/(rest)` and asserts each one
  is on the reserved list. Adding a route that clashes with an existing topic
  fails the test.
- Locale handling is the usual `next-i18n-router` behaviour
  ([locale-routing.md](locale-routing.md)).

## Data model (Payload, Postgres)

Every collection is scoped to one Resource Directory.

- **`landing-page-topics`** (table `lp_topics`): localized `name` and `slug`; localized overrides
  for SEO title, meta description, H1 and intro; the copied search; `source`.
- **`landing-pages`** (table `lp_pages`): one row per region × topic. Topic
  relation; `regionId` (`state:WA`, `county:53053`, `place:5370000`) with the
  region's name, type, state and `countyId` copied in; the untranslated
  `placeSlug`; `status` (`live`, `off`, `retired`); `redirect` (a target
  page, or a site path such as a `/search` URL); `resultCount`, `countedAt`;
  localized overrides for title, description, H1 and intro. Unique on
  Resource Directory + topic + region.
- **`landing-page-slugs`** (table `lp_slugs`): Resource Directory, locale,
  path (`topic-slug/place-slug`), page, `current`. Unique on Resource
  Directory + locale + path. Exactly one row per page and locale is current;
  rows are never deleted.

Topics and pages keep Payload versions (no drafts), which gives a dated change
history to compare with Search Console data. Tenant admins edit topics and
copy. Super-admins and support set status and manual redirect targets.

The public app (`NORSE_ROLE=app`) has no Postgres. It reads through
`@/lib/cms` bridge functions backed by internal CMS routes
([cms-app-separation-plan.md](cms-app-separation-plan.md)):

- resolve a path for a tenant and locale to a page or a redirect,
- list live pages with their slugs in every locale (for the sitemaps),
- the **version**: the latest `updatedAt` among the tenant's topics, pages
  and slugs, so any change (the generation job, an admin edit) moves it.
  Page and sitemap caches include it in their keys.

The CMS side is `src/payload/services/landingPages.ts`, the bridge
`src/lib/cms/landing-pages.ts`, the routes
`/api/internal/landing-pages/{resolve,sitemap,version}`. Path resolution
itself (`features/landing-pages/lib/resolve.ts`) is pure and tested against
a fake store in `tests/landing-pages-resolve.test.ts`.

## Generating pages

Saving the tab does not change any pages. **Apply changes** first runs the
generation diff without writing, shows "creates N, retires M (with targets),
unchanged K", and on confirmation queues the generation job:

- new region × topic pairs → `live` rows, with a slug for each tenant locale;
- every selected state gets its state page for each topic;
- removed pairs → `retired`, with a redirect target (see below);
- unchanged pairs are left alone; running the job twice changes nothing;
- its writes move the version, so cached pages and sitemaps refresh.

Every generated page is live. A page's result count never changes its status;
an admin can turn any page `off`.

## Old URLs keep working

The slug table maps every path ever issued to its page, so:

| Change | The old URL answers |
| --- | --- |
| Topic slug or page slug edited | 308 to the current slug |
| City removed | 308 to its county's page for the topic, else the state page |
| County removed | 308 to the state page |
| State removed | 308 to the equivalent `/search` URL |
| Topic removed | 308 to `/search` with the old query and region, unless an admin set a target |
| Page set to `off` | 404, or 308 when an admin set a target |
| Nothing sensible to point to | 410 |

Redirects use `permanentRedirect()` (308; `redirect()` gives a temporary 307).
Redirects never chain: when a page retires or a slug changes, every target
that pointed at it is recomputed. Editing a live slug shows the admin a
warning that its ranking moves to the new URL, with a short dip.

## Page copy

Four fields: SEO title, meta description, H1, intro. Each is filled, in order,
by the page override, the topic override, or the tenant template for the
locale.

| Variable | Value |
| --- | --- |
| `{topic}` | the topic's name in the page locale |
| `{location}` | the region's display name in the page locale: "Pierce County" / "Condado de Pierce", "Tacoma, WA" |
| `{state}` | the state's name |
| `{name}`, `{phone}`, `{email}` | the tenant values ([template-tags.md](template-tags.md)) |

Region display names are built from the app's locale strings, not stored in
the CMS, so every locale works without data entry. Templates are
machine-translated by the `translate` job with `{…}` variables protected from
translation. Unknown tags are left as typed. The editor shows character
counters (title about 60, description about 155) and a Google-result preview.
The result count is never put into copy, because a title that keeps changing
keeps moving the ranking.

## The page

`[locale]/(rest)/[topic]/[place]`, rendered on the server for every request.
It does not use the search intent's URL lift or resolver machine, AI
classification or prediction.

- **Metadata:** title and description from the copy; canonical tag pointing to
  itself on the canonical host; hreflang for every tenant locale plus
  `x-default` (the default locale).
- **Breadcrumbs:** Home › Topic › State › County › City.
- **Results:** the topic's search plus a region search on the page's region
  ([area-search.md](area-search.md)), with results and map pins rendered on
  the server through the generated SDK. One shared function builds this
  search for the page and for the warm-up job. `?page=n` paginates, and each
  page has its own canonical.
- **Child places:** a state page lists its counties, a county page lists its
  live cities.
- **Location:** the location field shows the page's place. The visitor's
  location cookie is never changed.
- **Refining** stays on the page with a query string. Those variants are
  `noindex` and their canonical is the plain URL.
- **No results:** a "call 211" message; the page is otherwise unchanged.
- **Bot protection:** `protectPage` like other directory pages
  ([bot-protection.md](bot-protection.md)).

Home page topic cards are unchanged; they still open `/search`.

## Sitemaps

**XML.** `/sitemap.xml` is a sitemap index pointing to
`/sitemaps/landing-{n}.xml` files of up to 10,000 URLs each. Each URL lists its
locale versions as hreflang alternates plus `x-default`. `lastmod` comes from
slug or copy changes, not from changing results. `robots.txt` adds a
`Sitemap:` line when the host serves one. `/sitemaps/resources-{n}.xml` is
reserved for resource pages.

**HTML.** `/sitemap` in each locale, linked from the footer of every page (the
link label comes from the app's translation strings). It groups pages by topic:
the state page, then counties A–Z with their cities indented. Past about 2,000
links it splits into `/sitemap/{topic-slug}` pages. It is indexable, with a
canonical pointing to itself and hreflang to the other locales. This footer
link is how crawlers and people find the landing pages, and links between the
landing pages lead to the rest.

## Caching

| Value | Where | Key | TTL |
| --- | --- | --- | --- |
| Resolved page config | Redis + memory | tenant, locale, path, version | memory 1 min; Redis until the version changes |
| Landing-page search results | Redis | `search_results:…` (shared builder) | 24 h, refreshed by the warm-up job |
| Landing-page map pins | Redis | `search_pins:…` | 24 h, refreshed by the warm-up job |
| XML and HTML sitemaps | Redis | tenant, locale, version | 24 h backstop |
| Region lists for the picker | Redis | state, type | 1 day |

The HTML of a page is not cached by a CDN, because a page served from the CDN
would skip the Arcjet check. New memory caches need a `MEMORY_CACHE_LIMITS`
entry ([caching.md](caching.md)).

## Warm-up and count job

A nightly Payload job in the CMS process, also run after the generation job
and after a data import if Norse-API can signal that one finished. For every
live page it runs the page's search and pins search in the tenant's default
locale, with a concurrency limit, which writes the exact keys the page reads.
It also saves `resultCount` and `countedAt` on the row. The page list shows
the counts as sortable columns, with a "0 results" filter and CSV export.

## Analytics

- **Umami:** search and result events carry `surface` (`landing` or `search`),
  `landingPageId` and `locale`.
- **Search Console:** a daily job imports impressions, clicks, CTR and average
  position per landing-page URL and query for each Tenant's property, into
  Norse-API/Mongo (the same pattern as
  [blocked-traffic-analytics.md](blocked-traffic-analytics.md)). A Payload
  widget shows trends per page and per topic. Nothing is stored in Postgres.
