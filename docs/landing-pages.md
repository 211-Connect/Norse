# SEO landing pages

A landing page is an indexable page for one topic in one place, such as "Food
pantries in Tacoma, WA" at `/food-pantries/tacoma-wa`. Each tenant chooses its
regions and topics in Payload. Norse generates a page for every region × topic
pair, in every locale the tenant has enabled, and lists each page in the
sitemaps so search engines find it.

**Status: built; Playwright e2e tests come later.**

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
| E2e tests (later) | ISS-2866 |

Out of scope: organization pages (ISS-2675), results chosen by SUNE need code
(ISS-2668), pages made from any search intent (ISS-2686), the canonical tag on
matching `/search` URLs (ISS-2671), and resource pages in the sitemap
(ISS-2679). The sitemap index leaves room for resource pages.

## Where it is configured

Settings are split by who edits them and what they apply to.

**Tenant → SEO** (the `seo` group; super-admin and support): only
`seo.noindex`, which keeps the host out of search engines. When it is on, the
host serves no landing pages and no sitemaps. Nothing else is configured per
host:

- **Canonical host:** the tenant's first trusted domain, which is the
  production domain by convention (`tenantCanonicalHost` in
  `src/utils/canonicalHost.ts`, exposed as `appConfig.canonicalHost`). It is
  used in canonical tags, hreflang links and sitemap URLs. To change it,
  reorder the trusted domains.
- **Sitemaps:** served whenever landing pages are served; there is no
  separate switch.

**Resource Directory → Landing Pages tab**: content, edited by tenant admins.
Every field is hidden until a super-admin turns on
`featureFlags.enableLandingPages`, the same pattern as printable directories.
Each tenant has its own Resource Directory.

- Summary card (`LandingSummaryCard`): live pages, locales, when pages were
  last generated and last counted, a link to the page list, and **Apply
  changes**. Apply changes is disabled while the form has unsaved edits,
  because it works from the saved settings.
- Regions (`RegionPickerField` on the `landingPages.regions` JSON field): a
  state › county › city tree.
- Topics: the `landing-page-topics` records.
- Page copy (`landingPages.templates`): the copy templates, per locale.

A host serves landing pages when its Resource Directory has the flag on and
the Tenant is not `noindex`; otherwise every landing URL is a 404. A
deployment that does not allow search engines
(`NEXT_PUBLIC_ALLOW_SEARCH_ENGINES` not `true`) still serves them, with the
`noindex, nofollow` every page there gets, so they can be checked on
staging. Sitemaps are served only when the deployment allows search engines.

The "Landing pages" group in the admin menu (pages and topics) is
shown only while the selected tenant has the flag on
(`src/payload/components/LandingPagesNavGate`). Payload's `admin.hidden` sees
the user but not the selected tenant, and would also close the collections'
routes, so the group is hidden with CSS. The admin lists open at 100 rows.
The URLs collection (`landing-page-slugs`) is internal and not in the menu;
the page editor shows a page's URLs.

## Regions

The picker loads a state's counties and cities from Norse-API
`GET /regions?state=XX` through the generated SDK (`getStateRegions` in
`src/payload/services/stateRegions.ts`, cached in Redis for a day; the first
load of a state takes a few seconds). Each entry has `id`, `type`, `name`,
`state` and, for cities, `county_id` (the county containing the city's
centroid). The admin picks one or more states, then ticks counties and
cities: one row per county with its cities under it, plus "Cities outside any
county". The tree has search, "Select all counties", "Select all cities",
"Clear" and per-county all/none links. Counties and cities are sorted by
name; the region index has no population, so sorting by population waits
until it does.

- A selected state always gets its state pages. The state itself can't be
  unticked.
- ZIP codes are not offered.
- The selection is saved as an **explicit list** of region ids, with name,
  type, state and `countyId` copied in. "Select all" ticks what the index holds
  now. A city added to the index later shows up as "N new cities available"
  and gets pages only after someone ticks it. Pages never appear or disappear
  just because the region index changed. To tell which cities are new, the
  state's entry stores `seen`: every region id the index held when the state
  was last edited. A city missing from `seen` is new; a state never edited in
  the picker shows none. The list logic is `lib/regionSelection.ts`, tested in
  `tests/landing-pages-region-selection.test.ts`. A ticked region the index
  later drops stays selected.

The tab's admin calls are custom endpoints on the `landing-pages` collection
(`src/payload/endpoints/landingPages.ts`). Each takes `tenantId` and allows
super-admins, support and admins of that tenant:

| Endpoint | Returns |
| --- | --- |
| `GET /api/landing-pages/admin/regions?tenantId=&state=` | The state's counties and cities; 502 when Norse-API fails. |
| `GET /api/landing-pages/admin/summary?tenantId=` | Live pages, locale count, last generated, last counted, the latest run. |
| `POST /api/landing-pages/admin/preview` `{ tenantId }` | The plan's counts and the first conflicts, without writing. |
| `POST /api/landing-pages/admin/apply` `{ tenantId }` | Queues the generation job; 409 while a run is queued or running. |

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

**In the admin.** The Landing Pages tab's Topics section
(`LandingTopicsField`) lists the tenant's topics (name, URL slug, search;
trashed ones greyed out as "In the trash") and has an **Add topics**
panel with three tabs: topic-card subtopics (multi-select, grouped by card;
link subtopics can't be ticked), search suggestions (their taxonomy codes),
and a custom query (text or comma-separated taxonomy codes). Each list has
"Select all", and each topic card its own; a subtopic or suggestion that is
already a topic is greyed out with a ✓. It reads the saved Resource Directory, so a
new card or suggestion appears after a save. `features/landing-pages/lib/topicSources.ts`
lists the sources and compares a topic with its source.

The topic editor shows a warning when its source subtopic or suggestion
changed (search or name) or is gone, with **Re-copy from source**, which
updates the form for the admin to save. Editing a slug that live pages use
shows that the ranking moves to the new URL; the old address redirects after
Apply changes.

**Names and slugs in every locale.** A topic is written in English. On
create, an empty slug is filled from the name. Whenever the English name or
copy changes, the `translateLandingTopic` job (queue `translation`) translates
them into the tenant's other locales with `{…}` tags masked
(`lib/templateTags.ts`), and sets each locale's slug from its translated name
unless someone edited that slug. Slugs are lower-case ASCII: accents are
dropped (`alimentación` → `alimentacion`). A name in a non-Latin script
(Chinese, Arabic, Russian…) has no ASCII slug, so that locale's slug stays
empty and its pages use the default locale's slug; the page is still in that
language. A slug must be unique among the tenant's topics in its locale and
must not be a reserved first segment (route folders and locale codes,
`RESERVED_TOPIC_SLUGS` in `features/landing-pages/lib/slugs.ts`);
`tests/landing-pages-slugs.test.ts` fails when a new route folder is missing
from that list.

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
- **Topic slugs are translated; region slugs are not.** Place names are proper
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

- **`landing-page-topics`** (table `lp_topics`, with Payload's trash,
  `deletedAt`): localized `name` and `slug`; localized overrides for SEO
  title, meta description, H1 and intro; the copied search; `source`.
- **`landing-pages`** (table `lp_pages`): one row per region × topic. Topic
  relation; `regionId` (`state:WA`, `county:53053`, `place:5370000`) with the
  region's name, type, state and `countyId` copied in; the untranslated
  `placeSlug` (the region slug, read-only); `status` (`live`, `off`,
  `retired`); `redirect` (a target page, or a site path such as a `/search`
  URL); `resultCount`, `countedAt`. Unique on
  Resource Directory + topic + region. Pages are never created or deleted
  by hand (`create` is closed): the generation job writes them.
- **`landing-page-slugs`** (table `lp_slugs`): Resource Directory, locale,
  path (`topic-slug/region-slug`), page, `current`. Unique on Resource
  Directory + locale + path. Exactly one row per page and locale is current;
  rows are never deleted.

Topics and pages keep Payload versions (no drafts), which gives a dated change
history to compare with analytics. Tenant admins edit topics and
the copy templates. Only super-admins and support edit pages: status and
manual redirect targets.

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
generation diff without writing, shows what would change (new pages, pages
back live, retired pages, moved URLs, updated redirects, skipped
conflicts), and on confirmation queues the generation job. The card polls
until the run ends:

- new region × topic pairs → `live` rows, with a slug for each tenant locale;
- every selected state gets its state page for each topic;
- removed pairs → `retired`, with a redirect target (see below);
- unchanged pairs are left alone; running the job twice changes nothing;
- its writes move the version, so cached pages and sitemaps refresh.

Every generated page is live. A page's result count never changes its status;
an admin can turn any page `off`.

**How it is built.** The diff is `planGeneration` in
`features/landing-pages/lib/plan.ts`, a pure function tested in
`tests/landing-pages-plan.test.ts`. Its input is the selection
(`landingPages.regions` on the Resource Directory, a JSON list of
`{ id, type, name, state, countyId }`), the tenant's topics (trashed ones marked),
the tenant's enabled locales and the existing rows. `previewLandingPages`
returns the plan for the confirmation; the `generateLandingPages` job (queue
`landingPages`, input `{ tenantId }`, no retries) writes it in one transaction
with bulk SQL (`src/payload/services/landingPagesGeneration.ts`), so generated
rows get a Payload version only once someone edits them.
`getLandingGenerationStatus` reads the tenant's latest run from the jobs
collection (queued, running, done with its counts, failed). Finished jobs are
deleted, so "last generated" falls back to the newest page update. The
plan's `addressChanges` counts moved URLs only; a new page's or new
language's first URL is not a change. The job refuses to
run while `featureFlags.enableLandingPages` is off.

Rules the plan follows:

- A region keeps the region slug its pages already have; a new region whose
  slug is taken gets its county's name added, then its number.
- A page set to `off` stays off, whatever the selection says.
- A page retired now gets the nearest live parent for the same topic (county,
  then state), else the equivalent `/search` URL. A target an admin already
  set is kept while it still leads somewhere.
- A topic is removed by deleting it, which moves it to Payload's trash: the
  plan reads every topic with `trash: true`, retires the pages of trashed
  ones, and still uses their search for the redirect. Restoring the topic
  brings its pages back on the next Apply changes. A topic with pages can't
  be deleted from the trash for good. Its slugs stay reserved while it is in
  the trash, so a new topic can't take over its old URLs.
- An address change (topic slug edited) makes the new path current and keeps
  the old row, which then redirects. Going back to an old slug makes that row
  current again. Two pages that would share an address are reported as
  conflicts and the second one is skipped.

## Old URLs keep working

The slug table maps every path ever issued to its page, so:

| Change | The old URL answers |
| --- | --- |
| Topic slug edited | 308 to the current slug |
| City removed | 308 to its county's page for the topic, else the state page |
| County removed | 308 to the state page |
| State removed | 308 to the equivalent `/search` URL |
| Topic moved to the trash | 308 to `/search` with the old query and region, unless an admin set a target |
| Page set to `off` | 404, or 308 when an admin set a target |
| Nothing sensible to point to | 404 (the App Router cannot answer a page with 410) |

Redirects use `permanentRedirect()` (308; `redirect()` gives a temporary 307).
Redirects never chain: when a page retires or a slug changes, every target
that pointed at it is recomputed. Editing a live slug shows the admin a
warning that its ranking moves to the new URL, with a short dip.

## Page copy

Four fields: SEO title, meta description, H1, intro. Each is filled from the
first layer that has it:

1. the topic override (`copy` on the topic),
2. the Resource Directory template (`landingPages.templates`, the "Page copy"
   group on the Landing Pages tab),
3. the built-in default for the locale (`defaults` in
   `public/locales/<locale>/landing-pages.json`).

| Variable | Value |
| --- | --- |
| `{topic}` | the topic's name in the page locale |
| `{location}` | the region's display name in the page locale: "Pierce County" / "Condado de Pierce", "Tacoma, WA" |
| `{state}` | the state's name |
| `{name}`, `{phone}`, `{email}` | the tenant values ([template-tags.md](template-tags.md)) |

A known tag with no value becomes empty; unknown tags and `{{…}}` are left as
typed. The logic is `features/landing-pages/lib/copy.ts` (`pickCopy`,
`fillCopy`, `regionDisplayName`), tested in `tests/landing-pages-copy.test.ts`.

**Region names** come from the `region` patterns in the same locale file
(`"county": "Condado de {{name}}"`, `"place": "{{name}}, {{state}}"`), so every
locale works without data entry. The index name's state suffix is dropped
("Pierce County, WA" → "Pierce"); only names ending in "County" use the
pattern, so parishes and boroughs keep their name. State names stay in
English. The strings were machine-translated with `npm run sync-translations`
and the county patterns then corrected by hand; where the local word was
uncertain the English "County" is kept.

**Translation.** Templates are written in English. Saving them queues the
`translate` job like other Resource Directory texts
(`AUTO_TRANSLATED_STRING_PATHS`). The job masks every single-brace tag before
sending text to the engine and restores it afterwards (`lib/templateTags.ts`,
lenient about sentinels the engine mangles); a tag the translation dropped is
appended. Clearing an English template clears it in every locale, so all
locales fall back to their built-in text together. Topic copy is translated
by `translateLandingTopic` the same way. Pages have no copy of their own:
across hundreds of pages, per-page text would rarely be kept up.

**Admin.** Every copy field (templates and topic) shows what it inherits
as a greyed placeholder and where it comes from; a filled field says what it
overrides, with **Use inherited** to clear it. A row of variable chips under
each field inserts a tag at the cursor (at the end when the field is not
focused). Title and description show the
length with sample values filled in, against about 60 and 155 characters. A
Google-result preview follows each group, built from the form's unsaved
values. It uses a sample page: a live county page
of the topic if there is one, else any live page, else a selected region. The
preview reads `GET /api/landing-pages/admin/copy-context` (inherited layers,
tag values, the sample page's site path; `src/payload/services/landingCopy.ts`).

The result count is never put into copy, because a title that keeps changing
keeps moving the ranking.

## Page list and editor

**List** (`/admin/collections/landing-pages`, scoped by the tenant selector):
columns label, topic, level (state, county, city), status, result count and
URL (the current URL in the default locale with a link, and how many
languages have one). Search matches the label and the region name; the
standard filters cover topic, level, status and result count (equals 0).
**Export CSV** downloads every page of the selected tenant with its current
URL in each locale (`GET /api/landing-pages/admin/export`).

**Editor:**

- URLs: the current URL in every locale with **Open page**, and the old URLs
  that redirect to it.
- Status: super-admins and support switch a page between Live and Off, one at
  a time or with bulk edit. Retired is set and cleared only by Apply changes;
  the API refuses it.
- Region slug: read-only. It is set when the page is generated and never
  changes, so a page's ranking never moves because of it.
- History: Payload versions (up to 50 per page). Pages written by the
  generation job get a version only once someone edits them.

## The page

`[locale]/(rest)/[topic]/[place]/page.tsx`, rendered on the server for every
request. It runs no AI classification or prediction, and it never redirects
to add coordinates (an area search needs none).

- **Lookup:** `resolveLandingRequest`
  (`features/landing-pages/server/landing-page-data.ts`) resolves the path
  through `getLandingResolution` (cached, see Caching). A redirect is a 308
  that keeps the visitor's refinements; `gone` and `not-found` are 404s.
  The page and its metadata share the lookup (React `cache`).
- **Metadata:** title and description from the copy; canonical pointing to
  itself on the canonical host (`appConfig.canonicalHost`, else the request
  host); hreflang for every locale the page has plus `x-default` (the
  default locale), from `landingAlternates` (`lib/seo.ts`).
- **Header** (`LandingHeader`, above the results list): breadcrumbs Home ›
  Topic › State › County › City, the H1 and the intro. The breadcrumbs are
  also a schema.org `BreadcrumbList` (`breadcrumbJsonLd`). The topic crumb
  links to the hub.
- **Results:** `landingBaseParams` (`lib/search.ts`) writes the topic's
  search plus a region search on the page's region
  ([area-search.md](area-search.md)) as `/search` URL parameters with
  `buildSearchUrl`, so the search is the one a visitor would run and shares
  its cache keys. From there it is the `/search` pipeline:
  `liftSearchRequest` → `toFindResourcesQuery` → `withAreaSettings` →
  `findResources`, then `SearchResultsProvider` and `SearchPageShell`, with
  map pins as on `/search`. The warm-up job builds the search the same way.
  `?page=n` paginates, and each page has its own canonical (`?page=n`).
- **Child places** (`LandingPlaces`, below the results): a state page lists
  its counties, a county page its live cities.
- **Location:** the location field shows the page's region. The page passes
  `fixedLocation` to `SearchStateSync`, so the visitor's location cookies
  are never changed.
- **Refining:** only `page`, `sort`, `age` and `filters` are read from the
  query string; anything else in it is ignored. `FixedSearchProvider`
  (`features/search/context/fixed-search-context.tsx`) gives the results'
  controls the page's search, and a control's `/search` URL comes back to
  the page as a query string while the search is still the page's own
  (`toLandingHref`); a different search goes to `/search`. A refined
  variant (anything but `page`) is `noindex, follow`, with its canonical on
  the plain URL. Metadata only ever adds `noindex`: a deployment that
  blocks crawlers keeps its `noindex, nofollow`.
- **No results:** the usual no-results card, which shows the tenant's phone
  number; the rest of the page is unchanged.
- **Bot protection:** `protectPage` before any data fetch, like other
  directory pages ([bot-protection.md](bot-protection.md)).

**Hub** (`[locale]/(rest)/[topic]/page.tsx`): `/{topic-slug}` lists the
topic's live pages at the highest level the tenant has (states, else
counties, else cities; `hubPages` in `lib/hub.ts`), from the cached sitemap
data. With one page there, it is a 308 to it. An unknown slug is a 404.
It has breadcrumbs (Home › topic), a canonical pointing to itself and
hreflang to the topic's slug in each locale.

The page labels (Home, the child-place headings) are in
`public/locales/<locale>/landing-pages.json` under `page`; a locale without
them uses English.

Home page topic cards are unchanged; they still open `/search`.

## Sitemaps

**XML.** `/sitemap.xml` is a sitemap index pointing to
`/sitemaps/landing-{n}.xml` files of up to 10,000 URLs each
(`src/app/sitemap.xml/route.ts`, `src/app/sitemaps/[file]/route.ts`,
builders in `features/landing-pages/lib/xmlSitemap.ts`).

- One URL per page and locale. Each lists every locale version of its page
  as an `xhtml:link rel="alternate" hreflang` entry, plus `x-default` (the
  default locale's version).
- `lastmod` is the later of the page's and its current slugs' `updatedAt`:
  slug or copy changes, never changing results. Each file in the index has
  the latest `lastmod` of its URLs.
- URLs are on the canonical host, like the pages' canonical tags.
- Served (otherwise 404) when the host serves landing pages, search engines
  may index it (`shouldBlockCrawlers`: the deployment allows them and the
  Tenant is not `noindex`), and it has at least one live page. The CMS role
  never serves them. Both paths skip the proxy, like `robots.txt`, so
  `sitemaps` and `sitemap` are reserved topic slugs.
- `robots.txt` adds a `Sitemap:` line when the host serves one.
- `/sitemaps/resources-{n}.xml` is reserved for resource pages.
- Built per request from the cached page list (`landing_sitemap`, see
  Caching), with `Cache-Control: public, max-age=600`.

**HTML.** `/sitemap` in each locale (`[locale]/(rest)/sitemap/page.tsx`,
tree in `lib/htmlSitemap.ts`). This page is how crawlers and people find the
landing pages, and links between the landing pages lead to the rest.

- **Footer link** on every page while the flag is on and the Tenant is not
  `noindex`. Its label is `footer.sitemap` in `common.json`, not the CMS
  footer menu.
- **Layout:** one collapsible section (`<details>`) per topic, A–Z. Each
  section lists its states, then counties A–Z with their cities indented
  under them. Collapsed sections stay in the HTML, so crawlers see every
  link. A state without a page is a heading without a link. Cities whose
  county has no page come last.
- **Size:** past 2,000 links in a locale (`HTML_SITEMAP_LINK_LIMIT`),
  `/sitemap` lists the topics only, and each topic gets
  `/sitemap/{topic-slug}`. Those pages always exist, but they are only
  linked once the page splits.
- **SEO:** indexable, with a canonical pointing to itself and hreflang to
  the locales that have pages (topic pages: the topic's slug in each
  locale).
- **A locale without pages** lists the default locale's pages, so the footer
  link never leads to a 404. That variant is `noindex, follow`.
- **404** when the host serves no landing pages or has none at all.
- **Data:** built from the cached page list (`landing_sitemap`, see Caching).
- Metadata only ever adds `noindex`. A deployment that blocks crawlers keeps
  its `noindex, nofollow`.

## Caching

| Value | Where | Key | TTL |
| --- | --- | --- | --- |
| Version (any change to the tenant's topics, pages or URLs) | memory | `landing_version:<tenant>` | 1 min |
| Resolved page | Redis + memory | `landing_page:<tenant>:<locale>:<hash of version and path>` | 1 day; a new version is a new key |
| Live pages per locale (hub, sitemaps) | Redis + memory | `landing_sitemap:<tenant>:<hash of version>` | 1 day; a new version is a new key |
| Landing-page search results | Redis | `search_results:…` (shared builder) | 24 h, refreshed by the warm-up job |
| Landing-page map pins | Redis | `search_pins:…` | 24 h, refreshed by the warm-up job |
| XML and HTML sitemaps | built per request from the page list above | | XML: HTTP `max-age` 10 min |
| Region lists for the picker | Redis | state, type | 1 day |

The HTML of a page is not cached by a CDN, because a page served from the CDN
would skip the Arcjet check. New memory caches need a `MEMORY_CACHE_LIMITS`
entry ([caching.md](caching.md)).

## Warm-up and count job

`warmLandingPages` (`src/payload/jobs/warmLandingPages.ts`, service
`src/payload/services/landingPagesWarmup.ts`) runs in the CMS process on the
`landingPages` queue:

- **When:** nightly at 03:30 for every tenant with the flag on, and for one
  tenant after each generation run (Apply changes queues it). Norse-API has no
  import-finished signal (the data is published by Dagster), so there is no
  run after an import.
- **What:** for every live page it builds the page's search with
  `landingSearch` (`features/landing-pages/server/landing-search.ts`), the one
  builder the route uses too, in the tenant's default locale. Then it runs
  the first page of results and, when the tenant shows every result on the
  map, the pins search. Both are written to the keys the page reads
  (`search_results:…`, `search_pins:…`) with `refresh` (no read first) and a
  24 h TTL (`LANDING_SEARCH_TTL`); the page itself also caches its searches
  for 24 h. Other locales and later pages of results are not warmed.
- **Concurrency:** 4 pages at a time (`WARMUP_CONCURRENCY`).
- **Count:** `resultCount` and `countedAt` are written straight to `lp_pages`,
  not through Payload. A Payload update would bump `updatedAt`, which would
  move the sitemap `lastmod` and the cache version every night. Counts never
  change a page's status or copy.
- **Failures:** a failing page is logged (`Landing page warm-up failed`) and
  skipped; the run goes on. The output has `tenants`, `pages`, `warmed`,
  `zeroResults` and `failed`.
- Warm-up searches are not counted in the search metrics.

The page list shows **Results** and **Counted** as sortable columns. **0
results** above the list filters it to `resultCount = 0` (it shows in
Filters), and **Export CSV** includes `result_count` and `counted_at`. The
summary card shows when pages were last counted.

## Analytics

Landing-page analytics come from Umami only. Search events (`search_text`,
`search_taxonomy`, `search_hybrid`) and the zero-results event
(`search_zero_results`) carry:

| Field | Value |
| --- | --- |
| `surface` | `landing` on a landing page, `search` everywhere else |
| `landingPageId` | the landing page's id (landing only) |
| `locale` | the page's locale |

Funnels and searches can then be split by surface and by page. The landing
page marks itself with `LandingAnalytics` (`landingPageIdAtom`, cleared when
the visitor leaves), so a search started from its search bar or dialog
reports `surface: landing`. `ResultsEvents` takes the page id as a prop. The
payload is built by `searchSurfacePayload` in
`src/app/(app)/shared/lib/analytics.ts`.

Google Search numbers (impressions, clicks, position) are not imported; read
them in Google Search Console.
