# Technical SEO on existing pages

What Norse tells search engines about the pages it already serves: which URL is a page's own (canonical), and what
a resource is (schema.org structured data). Landing pages (ISS-2296) and their sitemap, hreflang and cache policy
are ISS-2299, not this doc.

## Resource detail pages (`/[locale]/search/[id]`, ISS-2678)

Code: `src/app/(app)/features/resource/seo/resourceSeo.ts`, used by
`src/app/(app)/[locale]/(rest)/search/[id]/page.tsx`. No configuration: every tenant gets both.

**Canonical.** `<link rel="canonical">` points to the page itself (decided 2026-11-06 for WA RHTP; a partner
directory pointing to the record steward's own site is deferred to ISS-2676). The URL is absolute: the request's
`host` and `x-forwarded-proto` (`getHost`), the custom base path if set, no locale prefix for the tenant's default
locale (as `next-i18n-router` serves it), and the id lower-cased so one resource has one URL. A 404 or a redirect has
no canonical, because `generateMetadata` returns nothing without a resource.

**Structured data.** One `<script type="application/ld+json">`:

| schema.org | From the record |
| --- | --- |
| `Service` `name`, `description`, `url` | `serviceName` (else `name`), `description`, the canonical URL |
| `provider` `Organization` | `organizationName`, `organizationUrl` |
| `availableChannel` `ServiceChannel` | `website`; `servicePhone` `ContactPoint` (`phone`, `email`); `serviceLocation` `Place` (`locationName`, the rank-1 physical address as `PostalAddress`) |
| `hoursAvailable` `OpeningHoursSpecification` | `hours`, only when the whole text parses (below) |

Rules:

- **Nothing comes from the URL.** Every value is the record's own field.
- **Absent is left out.** No key is written as `null` or empty; a `Place` needs an address.
- **No coordinates.** Some records carry coordinates that contradict their address (one WA211 record has
  central-Seattle coordinates for a Des Moines address), so the markup gives the address only.
- **Hours are never guessed.** `hours` is free text (WA211's comes from its source `SCHEDULE.description`).
  It becomes opening hours only when the whole value is `;`-separated day groups with one time range each, in
  WA211's compact form (`M-F, 8am-5pm.`, `M, Tu, Th, F, 9am-6pm; W, 1-6pm; Sa, 10-2pm.`: a start without am/pm
  takes the end's unless it would then start after it) or spelled out (`Monday 11:00am - 4:30pm`), or is exactly
  `24 hours daily.` (00:00–23:59 every day). A label (`Office:`), a note, several lines, "by appointment" or an
  overnight range leaves `hoursAvailable` out; the page still shows the text.
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
