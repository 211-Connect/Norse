import type { NextRequest, NextResponse } from 'next/server';

import { LOCALE_COOKIE } from '@/lib/locale-cookie';

/**
 * Whether the browser is loading this URL as a page: a GET with `Sec-Fetch-Mode: navigate`. The browser
 * sets that header itself and page scripts cannot, so every `fetch` the App Router makes (prefetches,
 * client-side navigations, server actions) reads as `cors`/`same-origin`. A browser that sends no
 * `Sec-Fetch-Mode` at all is treated as navigating, which is how every request was treated before.
 *
 * The router's own markers (`RSC`, `Next-Router-Prefetch`, `_rsc`) cannot be used: Next strips them from the
 * request before the proxy runs (`FLIGHT_HEADERS` in `next/dist/server/web/adapter.js`).
 */
export function isDocumentNavigation(request: NextRequest): boolean {
  if (request.method !== 'GET') return false;
  const mode = request.headers.get('sec-fetch-mode');
  return mode === null || mode === 'navigate';
}

/**
 * Keeps `next-i18n-router` from writing the locale cookie on anything but a document navigation.
 *
 * It writes the cookie from the path of every request it routes. The App Router requests locale-prefixed
 * paths in the background: while the language switcher goes from `/es/search` to English, the Spanish page
 * is still mounted and prefetches its `/es…` links, and those responses set the cookie back to `es` after
 * the switch. The next unprefixed navigation (a filter, the search dialog, a header link) is then
 * redirected to Spanish. A language change made in the app is recorded by the switcher's
 * `POST /api/locale` instead.
 *
 * Call it last, after every other cookie is set on the response.
 */
export function keepLocaleCookieForDocumentNavigations(
  request: NextRequest,
  response: NextResponse,
): void {
  if (isDocumentNavigation(request)) return;
  const setCookies = response.headers.getSetCookie();
  const kept = setCookies.filter(
    (cookie) => !cookie.startsWith(`${LOCALE_COOKIE}=`),
  );
  if (kept.length === setCookies.length) return;
  response.headers.delete('set-cookie');
  for (const cookie of kept) response.headers.append('set-cookie', cookie);
}
