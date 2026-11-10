# Locale routing and the locale cookie

How a request's language is chosen, and who may change the visitor's saved language.

## URLs

- The tenant's default locale has no prefix (`/search?…`); every other locale does (`/es/search?…`).
- `/en/…` (the default locale, prefixed) redirects to the unprefixed path.
- Locales per tenant come from `ResourceDirectory` (`enabledLocales`, `defaultLocale`), resolved in
  `src/proxy.ts`.

Routing is done by `next-i18n-router` in `src/proxy.ts`.

## The `NEXT_LOCALE` cookie

An **unprefixed** path takes its language from the `NEXT_LOCALE` cookie: `/search?…` is served in English
when the cookie is missing or says the default locale, and redirected to `/es/search?…` when it says `es`.
Without a cookie, the browser's `Accept-Language` decides.

Several client navigations still push unprefixed paths (the search dialog, header links), so the cookie
must hold the language the visitor actually chose. Two places write it, nothing else:

1. **The proxy, on a document navigation** to a prefixed path: opening an `/es/…` link (typed, shared,
   bookmarked) makes Spanish the saved language. A document navigation is a `GET` with
   `Sec-Fetch-Mode: navigate`, or with no `Sec-Fetch-Mode` (older browsers).
   `keepLocaleCookieForDocumentNavigations` (`src/middlewares/localeCookieMiddleware.ts`) removes the
   cookie `next-i18n-router` writes on every other request.
2. **The language switcher**, with `POST /api/locale` (`src/app/(app)/api/locale/route.ts`), before it
   navigates. Then it pushes the target URL client-side; switching to the default locale goes straight to
   the unprefixed path (`localeSwitchHrefs`, `src/app/(app)/shared/lib/locale-switch.ts`), without the
   `/en/…` redirect. If the request fails it loads the prefixed URL as a page instead (`/en/search?…`),
   which the proxy records.

Both use `localeCookieOptions()` from `src/lib/locale-cookie.ts`. The cookie stays `HttpOnly`, so the
browser cannot write it from script.

`/api/locale` is a route handler, not a Server Action: a Server Action that sets a cookie makes Next
re-render the current page (`action-handler.js`, `isCookieRevalidated`), which on a search page is a whole
search the switcher throws away. It only checks that the locale is one Norse knows; the proxy ignores a
cookie that is not one of the tenant's locales. Cross-site requests (`Sec-Fetch-Site`) are refused.

### Why router fetches may not write it

The App Router requests locale-prefixed paths in the background. While the switcher goes from
`/es/search` to English, the Spanish page is still mounted and prefetches its `/es…` links; when those
responses wrote the cookie, it went back to `es` after the switch, and the next unprefixed navigation (a
filter click) landed in Spanish.

The router's own markers (`RSC`, `Next-Router-Prefetch`, `_rsc`) can't be used to recognise these requests:
Next strips them before the proxy runs (`FLIGHT_HEADERS` in `next/dist/server/web/adapter.js`).
`Sec-Fetch-Mode` is set by the browser, cannot be set by page scripts, and does reach the proxy.

## Keeping the language in the URL

Prefer building client navigations with the page's locale prefix, so the URL alone decides the language:
`useLocalePrefix()` (`src/app/(app)/shared/hooks/use-locale-prefix.ts`) returns `''` or `/es`. The filter
panel (`use-search-results-navigation.ts`), sort and pagination do this; `LocalizedLink` does it for links.

## Tests

- `tests/locale-cookie.test.ts`: which requests may write the cookie, `/api/locale`, and the switcher's
  URLs.
- `e2e/translations.spec.ts` › "clicking a filter after switching EN -> ES -> EN stays in English".
