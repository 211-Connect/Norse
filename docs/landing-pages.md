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

- Summary card (`LandingSummaryCard`): live pages, locales, when pages were
  last generated and last counted, a link to the page list, and **Apply
  changes**. Apply changes is disabled while the form has unsaved edits,
  because it works from the saved settings.
- Regions (`RegionPickerField` on the `landingPages.regions` JSON field): a
  state › county › city tree.
- Topics: the `landing-page-topics` records.
- Page copy (`landingPages.templates`): the copy templates, per locale.

A host serves landing pages and sitemaps only when its Resource Directory has
the flag on and the Tenant is not `noindex`.

The "Landing pages" group in the admin menu (pages, topics, addresses) is
shown only while the selected tenant has the flag on
(`src/payload/components/LandingPagesNavGate`). Payload's `admin.hidden` sees
the user but not the selected tenant, and would also close the collections'
routes, so the group is hidden with CSS. The admin lists open at 100 rows.

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
(`LandingTopicsField`) lists the tenant's topics and has an **Add topics**
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

- **`landing-page-topics`** (table `lp_topics`): `enabled` (Generate pages); localized `name` and `slug`; localized overrides
  for SEO title, meta description, H1 and intro; the copied search; `source`.
- **`landing-pages`** (table `lp_pages`): one row per region × topic. Topic
  relation; `regionId` (`state:WA`, `county:53053`, `place:5370000`) with the
  region's name, type, state and `countyId` copied in; the untranslated
  `placeSlug`; `status` (`live`, `off`, `retired`); `redirect` (a target
  page, or a site path such as a `/search` URL); `resultCount`, `countedAt`;
  localized overrides for title, description, H1 and intro. Unique on
  Resource Directory + topic + region. Pages are never created or deleted
  by hand (`create` is closed): the generation job writes them.
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
generation diff without writing, shows what would change (new pages, pages
back live, retired pages, moved addresses, updated redirects, skipped
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
`{ id, type, name, state, countyId }`), the tenant's topics with `enabled` on,
the tenant's enabled locales and the existing rows. `previewLandingPages`
returns the plan for the confirmation; the `generateLandingPages` job (queue
`landingPages`, input `{ tenantId }`, no retries) writes it in one transaction
with bulk SQL (`src/payload/services/landingPagesGeneration.ts`), so generated
rows get a Payload version only once someone edits them.
`getLandingGenerationStatus` reads the tenant's latest run from the jobs
collection (queued, running, done with its counts, failed). Finished jobs are
deleted, so "last generated" falls back to the newest page update. The
plan's `addressChanges` counts moved addresses only; a new page's or new
language's first address is not a change. The job refuses to
run while `featureFlags.enableLandingPages` is off.

Rules the plan follows:

- A region keeps the place slug its pages already have; a new region whose
  slug is taken gets its county's name added, then its number.
- A page set to `off` stays off, whatever the selection says.
- A page retired now gets the nearest live parent for the same topic (county,
  then state), else the equivalent `/search` URL. A target an admin already
  set is kept while it still leads somewhere.
- A removed topic is turned off with **Generate pages** (`enabled`), not
  deleted: a topic with pages can't be deleted, because its retired pages
  still need its search for their redirect.
- An address change (topic slug edited) makes the new path current and keeps
  the old row, which then redirects. Going back to an old slug makes that row
  current again. Two pages that would share an address are reported as
  conflicts and the second one is skipped.

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

Four fields: SEO title, meta description, H1, intro. Each is filled from the
first layer that has it:

1. the page override (`copy` on the page),
2. the topic override (`copy` on the topic),
3. the Resource Directory template (`landingPages.templates`, the "Page copy"
   group on the Landing Pages tab),
4. the built-in default for the locale (`defaults` in
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
by `translateLandingTopic` the same way. Page overrides are not translated.

**Admin.** Every copy field (templates, topic, page) shows what it inherits
as a greyed placeholder and where it comes from; a filled field says what it
overrides, with **Use inherited** to clear it. A row of variable chips under
each field inserts a tag at the cursor (at the end when the field is not
focused). Title and description show the
length with sample values filled in, against about 60 and 155 characters. A
Google-result preview follows each group, built from the form's unsaved
values. On the templates and a topic it uses a sample page: a live county page
of the topic if there is one, else any live page, else a selected region. The
preview reads `GET /api/landing-pages/admin/copy-context` (inherited layers,
tag values, the page's site path; `src/payload/services/landingCopy.ts`).

The result count is never put into copy, because a title that keeps changing
keeps moving the ranking.

## Page list and editor

**List** (`/admin/collections/landing-pages`, scoped by the tenant selector):
columns label, topic, level (state, county, city), status, result count and
URL (the current address in the default locale with a link, and how many
languages have one). Search matches the label and the place name; the
standard filters cover topic, level, status and result count (equals 0).
**Export CSV** downloads every page of the selected tenant with its current
URL in each locale (`GET /api/landing-pages/admin/export`).

**Editor:**

- Addresses: the current address in every locale with **Open page**, and the
  old addresses that redirect to it.
- Status: super-admins and support switch a page between Live and Off, one at
  a time or with bulk edit. Retired is set and cleared only by Apply changes;
  the API refuses it.
- Place slug: super-admins and support can edit it (lowercase, digits,
  hyphens). A warning explains the ranking move. The new address applies on
  Apply changes, which keeps the old one as a redirect.
- Copy overrides with inheritance and the preview, as above.
- History: Payload versions (up to 50 per page). Pages written by the
  generation job get a version only once someone edits them.

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
