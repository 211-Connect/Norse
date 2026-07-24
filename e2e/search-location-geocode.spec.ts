import { baseURL } from '../playwright.config';
import { expect, LOCALE, test } from './helpers';
import { SEARCH_NAV_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Deep links can arrive with a human-readable `location` but no `coords`
 * (e.g. shared links, external referrers, older bookmarks). The search page
 * forward-geocodes `location` server-side and redirects to the same URL with
 * `coords` appended so geo search/sort/map rendering all work correctly.
 *
 * @see src/app/(app)/features/search/utils/navigateToSearchWithCoords.ts
 * @see src/middlewares/searchLinkCorrectionMiddleware.ts
 */

function buildSearchDeepLinkUrl(params: Record<string, string>): string {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL(`${LOCALE}/search`, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

function getCoordsParam(pageUrl: string): string | null {
  return new URL(pageUrl).searchParams.get('coords');
}

test.describe('Search deep link geocoding', () => {
  test('a deep link with a location but no coords is auto-geocoded and results load', async ({
    page,
  }) => {
    const deepLink = buildSearchDeepLinkUrl({
      location: 'Minneapolis, MN',
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await page.goto(deepLink, { waitUntil: 'domcontentloaded' });

    // The page forward-geocodes `location` and redirects to the same page
    // with `coords` appended to the query string.
    await expect
      .poll(() => getCoordsParam(page.url()), {
        timeout: SEARCH_NAV_TIMEOUT_MS,
        intervals: [250, 500, 1_000],
      })
      .not.toBeNull();

    const coords = getCoordsParam(page.url());
    expect(coords).toBe("-93.266096,44.976106");

    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await expect(page.locator('#result-total')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('geocoded coords reflect the deep link location, not a stale location preference cookie', async ({
    page,
    context,
  }) => {
    // Deliberately far from the deep link location below (Anchorage, AK vs
    // Minneapolis, MN) so a coords match would indicate the fix regressed to
    // using the stale cookie instead of geocoding the deep link's location.
    const staleCoords = '-149.9,61.2';

    await context.addCookies([
      { name: 'user-pref-location', value: 'Anchorage, AK', url: baseURL },
      { name: 'user-pref-coords', value: staleCoords, url: baseURL },
    ]);

    const deepLink = buildSearchDeepLinkUrl({
      location: 'Minneapolis, MN',
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await page.goto(deepLink, { waitUntil: 'domcontentloaded' });

    await expect
      .poll(() => getCoordsParam(page.url()), {
        timeout: SEARCH_NAV_TIMEOUT_MS,
        intervals: [250, 500, 1_000],
      })
      .not.toBeNull();

    const coords = getCoordsParam(page.url());
    expect(coords).not.toBe(staleCoords);
  });
});
