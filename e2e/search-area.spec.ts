import type { Page } from '@playwright/test';

import { baseURL } from '../playwright.config';
import { type AreaPick, getCurrentTenant } from './fixtures/tenants';
import {
  chooseLocationFromSearchPage,
  expect,
  expectPageUrl,
  getResultTotalNumber,
  LOCALE,
  submitSearchDialog,
  test,
  waitForSearchResultsSettled,
} from './helpers';
import { SEARCH_NAV_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Area search (docs/area-search.md): a state, county, city or ZIP picked in
 * the location field searches its Region (`region` in the URL) with no
 * radius, and the map outlines it; an address, or a city with no Region yet,
 * stays a point + radius search. Picks are real geocoder suggestions per
 * tenant (`TenantFixture.areaSearch`).
 */

const tenant = getCurrentTenant();
const areas = tenant.areaSearch;

function searchUrl(params: Record<string, string>): string {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL(`${LOCALE}/search`, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

const broadSearch = { query: tenant.broadQuery, query_type: 'text' };

async function openBroadSearch(page: Page) {
  await page.goto(searchUrl(broadSearch), { waitUntil: 'domcontentloaded' });
  await waitForSearchResultsSettled(page);
}

async function pickLocation(
  page: Page,
  pick: { typed: string; suggestion: string },
) {
  await chooseLocationFromSearchPage(page, pick);
  await submitSearchDialog(page);
}

const param = (page: Page, key: string) =>
  new URL(page.url()).searchParams.get(key);

function getDistanceSelect(page: Page) {
  return page.locator('#distance-select-trigger');
}

async function expectAreaSearch(page: Page, area: AreaPick) {
  await expectPageUrl(
    page,
    (url) => url.searchParams.get('region') === area.regionId,
  );
  expect(param(page, 'distance')).toBeNull();
  // Coords stay: they are the distance-sort origin.
  expect(param(page, 'coords')).not.toBeNull();

  expect(await getResultTotalNumber(page)).toBeGreaterThan(0);
  await expect(getDistanceSelect(page)).toHaveCount(0);

  await expect(page.getByTestId('map-legend-area')).toContainText(
    area.legendName,
    { timeout: UI_SHELL_TIMEOUT_MS },
  );
  await expect(page.getByTestId('search-map')).toHaveAttribute(
    'data-search-area',
    'shown',
    { timeout: UI_SHELL_TIMEOUT_MS },
  );
}

async function expectPointSearch(page: Page) {
  await expectPageUrl(page, (url) => url.searchParams.has('coords'));
  expect(param(page, 'region')).toBeNull();
  expect(await getResultTotalNumber(page)).toBeGreaterThan(0);
  await expect(getDistanceSelect(page)).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await expect(page.getByTestId('map-legend-area')).toHaveCount(0);
  await expect(page.getByTestId('search-map')).not.toHaveAttribute(
    'data-search-area',
    'shown',
  );
}

const AREA_KINDS = ['state', 'county', 'zip', 'city'] as const;

test.describe('Area search', () => {
  for (const kind of AREA_KINDS) {
    test(`picking a ${kind} searches its Region, without a radius, and outlines it`, async ({
      page,
    }) => {
      const area = areas[kind];
      test.skip(!area, `no ${kind} Regions seeded for ${tenant.key} yet`);

      await openBroadSearch(page);
      await pickLocation(page, area!);
      await expectAreaSearch(page, area!);
    });
  }

  test('picking an address stays a point search with a radius', async ({
    page,
  }) => {
    await openBroadSearch(page);
    await pickLocation(page, areas.address);
    await expectPointSearch(page);
  });

  test('a city with no Region yet falls back to a point search', async ({
    page,
  }) => {
    test.skip(
      !areas.unseededCity,
      `no unseeded city fixture for ${tenant.key}`,
    );

    await openBroadSearch(page);
    await pickLocation(page, areas.unseededCity!);
    await expectPointSearch(page);
  });

  test('replacing an area with an address drops the Region', async ({
    page,
  }) => {
    await openBroadSearch(page);
    await pickLocation(page, areas.county);
    await expectAreaSearch(page, areas.county);

    await pickLocation(page, areas.address);
    await expectPointSearch(page);
  });

  test('pagination and the next search keep the Region', async ({ page }) => {
    await openBroadSearch(page);
    await pickLocation(page, areas.county);
    await expectAreaSearch(page, areas.county);

    const nextPage = page.getByRole('link', { name: /go to next page/i });
    test.skip((await nextPage.count()) === 0, 'one page of results only');
    await expect(nextPage.first()).toHaveAttribute(
      'href',
      new RegExp(`region=${encodeURIComponent(areas.county.regionId)}`),
    );
  });

  test('a deep link with an area location and no coords gets its Region', async ({
    page,
  }) => {
    await page.goto(
      searchUrl({ ...broadSearch, location: areas.county.suggestion }),
      { waitUntil: 'domcontentloaded' },
    );

    await expect
      .poll(() => param(page, 'region'), { timeout: SEARCH_NAV_TIMEOUT_MS })
      .toBe(areas.county.regionId);
    await waitForSearchResultsSettled(page);
    await expectAreaSearch(page, areas.county);
  });

  test('a returning visitor gets their saved area back, without a radius', async ({
    page,
  }) => {
    await openBroadSearch(page);
    await pickLocation(page, areas.county);
    await expectAreaSearch(page, areas.county);

    // A fresh link with no location: the middleware restores the saved one.
    await page.goto(searchUrl(broadSearch), { waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => param(page, 'region'), { timeout: SEARCH_NAV_TIMEOUT_MS })
      .toBe(areas.county.regionId);
    await waitForSearchResultsSettled(page);
    await expectAreaSearch(page, areas.county);
  });

  test('a shared area link never takes a radius from the visitor cookie', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'user-pref-distance', value: '30', url: baseURL },
    ]);

    await page.goto(
      searchUrl({
        ...broadSearch,
        location: areas.county.suggestion,
        region: areas.county.regionId,
      }),
      { waitUntil: 'domcontentloaded' },
    );
    await waitForSearchResultsSettled(page);

    expect(param(page, 'distance')).toBeNull();
    await expect(page.getByTestId('map-legend-area')).toContainText(
      areas.county.legendName,
      { timeout: UI_SHELL_TIMEOUT_MS },
    );
  });

  test('an invalid region id is replaced by the geocoded one', async ({
    page,
  }) => {
    await page.goto(
      searchUrl({
        ...broadSearch,
        location: areas.county.suggestion,
        region: 'county:nope',
      }),
      { waitUntil: 'domcontentloaded' },
    );

    // The id is dropped, so the location is geocoded as a deep link.
    await expect
      .poll(() => param(page, 'region'), { timeout: SEARCH_NAV_TIMEOUT_MS })
      .toBe(areas.county.regionId);
    await waitForSearchResultsSettled(page);
    await expectAreaSearch(page, areas.county);
  });
});
