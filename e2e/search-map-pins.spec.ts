import { type Locator, type Page } from '@playwright/test';

import { getMapPinsFixtureForCurrentTenant } from './fixtures/tenants';
import {
  clickMapPoint,
  expect,
  expectPageUrl,
  getSearchMap,
  getSearchMapNumber,
  getSharedListMapPoints,
  getSingleListMapPoints,
  goHome,
  isSearchResourceDetailUrl,
  performSearch,
  test,
  waitForMapPinsLoaded,
  waitForSearchResultsSettled,
  zoomInUntilCountsShow,
} from './helpers';
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Every result on the search map (`showAllResultsOnMap`, docs/map-pins.md):
 * an empty search shows the whole directory as circles, counts on shared
 * addresses appear only once zoomed in, and a list circle's popup leads to a
 * working resource page, from a shared address's list or a single resource's
 * button.
 */
test.describe('Search map: every result', () => {
  const fixture = getMapPinsFixtureForCurrentTenant();

  test.skip(
    !fixture,
    'Show all results on the map is not on for this tenant/environment (no mapPins in e2e/fixtures/tenants.ts)',
  );

  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  /** Steps 1-4, shared by both scenarios. */
  async function searchEverythingOnTheMap(page: Page) {
    await test.step('1-2. Empty search from the home page', async () => {
      await performSearch(page, {
        query: '',
        query_label: '',
        query_type: 'text',
      });
      await waitForSearchResultsSettled(page);
    });

    await test.step('3. Result total and legend; every pin loads', async () => {
      await expect(page.locator('#result-total')).toHaveText(
        fixture!.resultTotal,
        { timeout: UI_SHELL_TIMEOUT_MS },
      );
      await waitForMapPinsLoaded(page);

      // The map draws more places than the list's page holds: the rest of
      // the search, not only the page.
      const listed = await page.getByTestId('resource-link').count();
      await expect
        .poll(() => getSearchMapNumber(page, 'data-shown-places'), {
          timeout: ASYNC_UI_TIMEOUT_MS,
        })
        .toBeGreaterThan(listed);
    });

    await test.step('4. No counts on the whole-directory view', async () => {
      await expect(getSearchMap(page)).toHaveAttribute(
        'data-shown-counts',
        '0',
      );
    });
  }

  /** Step 5: zooms in around `point` until counts show. */
  async function zoomInAround(page: Page, point: Locator, missing: string) {
    await test.step('5. Zooming in shows counts', async () => {
      await expect(point, missing).toBeAttached({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      await zoomInUntilCountsShow(page, point);
    });
  }

  /** Step 7: follows a popup's resource link to a working resource page. */
  async function expectResourcePage(page: Page, link: Locator) {
    await test.step('7. The resource link opens its page', async () => {
      const href = (await link.getAttribute('href')) ?? '';
      const resourceId = href.replace(/\/+$/, '').split('/').at(-1) ?? '';

      await link.click();
      await expectPageUrl(page, isSearchResourceDetailUrl);
      expect(page.url()).toContain(resourceId);
      await expect(page.getByTestId('favorite-btn').first()).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });
  }

  test('an empty search shows every result; a shared address lists its resources', async ({
    page,
  }) => {
    await searchEverythingOnTheMap(page);

    const shared = getSharedListMapPoints(page).first();
    await zoomInAround(
      page,
      shared,
      'No address on the list page has several resources',
    );

    const resources = Number(await shared.getAttribute('data-resources'));
    const popup = page.getByTestId('map-site-popup');
    const links = popup.getByTestId('map-site-popup-resource');

    await test.step('6. A shared list address lists its resources', async () => {
      await clickMapPoint(page, shared);
      await expect(popup).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
      await expect(links).toHaveCount(resources);
    });

    await expectResourcePage(page, links.first());
  });

  test('an empty search shows every result; a single resource opens from its button', async ({
    page,
  }) => {
    await searchEverythingOnTheMap(page);

    const single = getSingleListMapPoints(page).first();
    await zoomInAround(
      page,
      single,
      'No address on the list page has a single resource',
    );

    const popup = page.getByTestId('map-popup');
    const button = popup.getByTestId('map-popup-resource');

    await test.step('6. A single-resource list location shows its button', async () => {
      await clickMapPoint(page, single);
      await expect(popup).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
      await expect(page.getByTestId('map-site-popup')).toHaveCount(0);
      await expect(button).toBeVisible();
    });

    await expectResourcePage(page, button);
  });
});
