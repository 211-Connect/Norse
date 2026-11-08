# Technical SEO on existing pages

What Norse tells search engines about the pages it already serves: which URL is a page's own (canonical), and what
a resource is (schema.org structured data). Landing pages (ISS-2296) and their sitemap, hreflang and cache policy
are ISS-2299, not this doc.

## Resource detail pages (`/[locale]/search/[id]`, ISS-2678)

Code: `src/app/(app)/features/resource/seo/resourceSeo.ts`, used by
`src/app/(app)/[locale]/(rest)/search/[id]/page.tsx`. No configuration: every tenant gets both.

**Canonical.** `<link rel="canonical">` points to the page itself (decided 2026-11-06 for WA RHTP; a partner
directory pointing to the record steward's own site is deferred to ISS-2676). It is built once per request
(`canonicalFor` in the page) from:

- **the record's id** (`resource.id`, its service-at-location id), not the URL's. Norse-API's lookup falls back
  to the Mongo `_id` and then across tenants, so a page reached through a fallback still names the record's
  real URL;
- **the tenant's first trusted domain** (`trustedDomains[0]`, read through `@/lib/cms`), the primary domain
  Norse already uses elsewhere, so a tenant with several domains has one canonical. When the tenant cannot be
  read, it falls back to the request's host;
- the first value of `x-forwarded-proto` (a proxy chain can append more), the custom base path if set, and no
  locale prefix for the tenant's default locale (as `next-i18n-router` serves it). The id is lower-cased.

A 404 or a redirect has no canonical, because `generateMetadata` returns nothing without a resource. Locally and
on staging the canonical names the tenant's first trusted domain, which may be the production one; those hosts
are not indexed.

**Structured data.** One `<script type="application/ld+json">`:

| schema.org | From the record |
| --- | --- |
| `Service` `name`, `description`, `url` | `serviceName` (else `name`), `description`, the canonical URL |
| `provider` `Organization` | `organizationName`, `organizationUrl` |
| `availableChannel` `ServiceChannel` | `website`; `servicePhone` `ContactPoint` (`phone`, `email`); `serviceLocation` `Place` (`locationName`, and the address the page shows as `PostalAddress`) |

Rules:

- **Only the record's own fields**, plus the canonical as `url`. Nothing is read from the URL's query or path.
- **Only the address the page shows: the first `physical` one** (`address.tsx`), whatever its rank, with no
  fallback. A confidential site arrives as `type: 'virtual'` (dagster's resource writer nulls its street but
  keeps city, state and ZIP), and the page hides it behind a "may be confidential" notice, so the markup must
  never publish it. On 2026-11-07, 6,227 live resources across tenants had only non-physical addresses, 178 of
  them with a street still present. The bare `address` string is never used either.
- **Absent is left out.** No key is written as `null` or empty; a `Place` needs an address.
- **No coordinates.** Some records carry coordinates that contradict their address (one WA211 record has
  central-Seattle coordinates for a Des Moines address), so the markup gives the address only.
- **No hours yet.** The resource record carries hours only as display text (`translations[].hours`, from
  `DISPLAY_SCHEDULE`), and the markup parses no text (decided 2026-11-07). The structured weekly schedules
  (`FREQ`, `BYDAY`, `OPENS_AT`, `CLOSES_AT`) exist in `APP_SERVICE_AT_LOCATION_FULL.SERVICE.SCHEDULES` but are
  not written to the resource record; hours return to the markup once they are (SEO improvements, post-RHTP).
- **Escaped for HTML.** `jsonLdScript` writes `<`, `>`, `&`, U+2028 and U+2029 as JSON unicode escapes, so
  record text cannot close the script, and the JSON reads back unchanged.

Google shows no rich result for `Service`; the markup is for understanding, and is checked with the Schema Markup
Validator rather than for a rich-result preview.

**Ids will change.** Resource URLs are built from ids that a planned re-key will change. Old URLs redirect through
ISS-2514/ISS-2517, and the canonical always follows the page it is on.

Tests: `tests/resource-seo.test.ts`.

## Not built yet (sub-issues of ISS-2672)

| Piece | Ticket | Blocked on |
| --- | --- | --- |
| `sitemap.xml` of resource pages per tenant host | ISS-2679 | Norse-API has no endpoint that lists a tenant's resources; `/search` stops at 10,000 results |
| Canonical on `/search` pages | ISS-2680 | the landing page → query → Payload topic design (`query_label` is part of the intent) |
| Cacheable HTML for anonymous visitors | ISS-2681 | Arcjet bypass on cache hits, per-visitor HTML, first-visit cookies, Cloudflare rules |
