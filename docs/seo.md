# Technical SEO on existing pages

What Norse tells search engines about the pages it already serves. Today that is which URL is a resource page's
own (its canonical). Landing pages (ISS-2296) and their sitemap, hreflang and cache policy are ISS-2299, not this
doc.

## Resource detail pages (`/[locale]/search/[id]`, ISS-2678)

Code: `src/app/(app)/features/resource/seo/resourceSeo.ts`, used by `generateMetadata` in
`src/app/(app)/[locale]/(rest)/search/[id]/page.tsx`. No configuration: every tenant gets it.

**Canonical.** `<link rel="canonical">` points to the page itself (decided 2026-11-06 for WA RHTP; a partner
directory pointing to the record steward's own site is deferred to ISS-2676). It is built from:

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

**Ids will change.** Resource URLs are built from ids that a planned re-key will change. Old URLs redirect through
ISS-2514/ISS-2517, and the canonical always follows the page it is on.

Tests: `tests/resource-seo.test.ts`.

## Not built yet (sub-issues of ISS-2672)

| Piece | Ticket | Blocked on |
| --- | --- | --- |
| `sitemap.xml` of resource pages per tenant host | ISS-2679 | Norse-API has no endpoint that lists a tenant's resources; `/search` stops at 10,000 results |
| Canonical on `/search` pages | ISS-2680 | the landing page → query → topic card design (`query_label` is part of the intent) |
| Cacheable HTML for anonymous visitors | ISS-2681 | Arcjet bypass on cache hits, per-visitor HTML, first-visit cookies, Cloudflare rules |

Structured data (schema.org JSON-LD) on resource pages was tried and removed from this effort on 2026-11-08: Google
shows no rich result for it, and the data was not clean enough to publish safely.
