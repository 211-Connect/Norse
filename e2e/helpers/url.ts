import { type Page, expect } from '@playwright/test';

import { SEARCH_NAV_TIMEOUT_MS } from '../timeouts';

/**
 * True when the URL is the search **results list** (has query string), not a
 * resource detail route (`/search/{id}`). Uses pathname segments so it works
 * with any host, `basePath` (`NEXT_PUBLIC_CUSTOM_BASE_PATH`), locale prefixes,
 * and `trailingSlash` (`…/search/?query=` vs `…/search?query=`) — see
 * `next.config.js`.
 */
export function isSearchResultsListUrl(url: URL): boolean {
  const segments = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  return (
    segments.length > 0 && segments.at(-1) === 'search' && url.search.length > 0
  );
}

/**
 * True when the URL is a search resource detail route:
 * `.../search/{uuid}` (no query string required).
 */
export function isSearchResourceDetailUrl(url: URL): boolean {
  const segments = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const last = segments.at(-1) ?? '';
  const prev = segments.at(-2) ?? '';
  const uuidV4Like =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return prev === 'search' && uuidV4Like.test(last);
}

/**
 * Use instead of `waitForURL` for in-app routes: resolves if the page is
 * already on a matching URL, and does not depend on a specific readystate.
 */
export async function expectPageUrl(
  page: Page,
  url: string | RegExp | ((url: URL) => boolean),
  options?: { timeout?: number },
) {
  await expect(page).toHaveURL(url, {
    timeout: options?.timeout ?? SEARCH_NAV_TIMEOUT_MS,
  });
}

export function parseTrailingInteger(text: string): number {
  const match = text.replace(/,/g, '').match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

export function parseTotalFromResultText(text: string): number {
  const match = text.match(/of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Escapes a string for safe interpolation into a single `RegExp` literal. */
export function toSingleRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
