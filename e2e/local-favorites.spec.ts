import { type Page } from '@playwright/test';

import {
  expect,
  expectPageUrl,
  goHome,
  goToLocalFavorites,
  performSearch,
  resetLocalFavoritesStorage,
  test,
} from './helpers';
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

async function addFirstSearchResultToLocalFavorites(
  page: Page,
  query: string,
  queryLabel: string,
) {
  await performSearch(page, {
    query,
    query_label: queryLabel,
    query_type: 'text',
  });

  await page
    .locator('#search-container')
    .waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });

  const firstResourceLink = page.getByTestId('resource-link').first();
  await expect(firstResourceLink).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  const firstResourceName = (
    (await firstResourceLink.textContent()) ?? ''
  ).trim();

  const favoriteBtn = page.getByTestId('favorite-btn').first();
  await expect(favoriteBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await expect(favoriteBtn).toHaveAttribute(
    'data-session-status',
    'unauthenticated',
    {
      timeout: UI_SHELL_TIMEOUT_MS,
    },
  );
  await favoriteBtn.click();

  return { resourceName: firstResourceName };
}

test.describe('Favorites Feature (Anonymous Local List)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await goHome(page);
    await resetLocalFavoritesStorage(page);
  });

  test('should route anonymous favorites navigation to local favorites page', async ({
    page,
  }) => {
    await goToLocalFavorites(page);
    await expectPageUrl(page, /favorites\/local\/?(?:\?|$)/);
    await expect(page.getByTestId('create-list-btn')).toHaveCount(0);
  });

  test('should add a resource from search results to local favorites', async ({
    page,
  }) => {
    const { resourceName } = await addFirstSearchResultToLocalFavorites(
      page,
      'food',
      'food',
    );

    await goToLocalFavorites(page);

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await expect(page.getByTestId('purge-local-list-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('should remove a local favorite from local favorites page', async ({
    page,
  }) => {
    const { resourceName } = await addFirstSearchResultToLocalFavorites(
      page,
      'housing',
      'housing',
    );

    await goToLocalFavorites(page);

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await page.getByTestId('remove-from-list-btn').first().click();
    await page.getByTestId('remove-from-current-list-confirm-btn').click();

    await expect(page.getByText(resourceName)).toHaveCount(0, {
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });

  test('should purge all local favorites from local favorites page', async ({
    page,
  }) => {
    await addFirstSearchResultToLocalFavorites(page, 'food', 'food');
    await addFirstSearchResultToLocalFavorites(page, 'shelter', 'shelter');

    await goToLocalFavorites(page);

    await expect
      .poll(async () => page.getByTestId('remove-from-list-btn').count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
      })
      .toBeGreaterThan(0);

    await expect(page.getByTestId('purge-local-list-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await page.getByTestId('purge-local-list-btn').click();

    await expect(page.getByTestId('purge-list-confirm-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await page.getByTestId('purge-list-confirm-btn').click();

    await expect
      .poll(async () => page.getByTestId('remove-from-list-btn').count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
      })
      .toBe(0);

    await expect(page.getByTestId('purge-local-list-btn')).toHaveCount(0);
  });

  test('should add and remove a local favorite from resource details page', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });

    const resourceLink = page.getByTestId('resource-link').first();
    await expect(resourceLink).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await resourceLink.click();

    await expectPageUrl(page, /search\/[a-f0-9-]{36}/);

    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await expect(favoriteBtn).toHaveAttribute(
      'data-session-status',
      'unauthenticated',
      {
        timeout: UI_SHELL_TIMEOUT_MS,
      },
    );

    await favoriteBtn.click();

    await favoriteBtn.click();

    await goToLocalFavorites(page);

    await expect
      .poll(async () => page.getByTestId('remove-from-list-btn').count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
      })
      .toBe(0);
  });

  test('should persist local favorites after reload and in a new tab', async ({
    page,
    context,
  }) => {
    const { resourceName } = await addFirstSearchResultToLocalFavorites(
      page,
      'food',
      'food',
    );

    await goToLocalFavorites(page);

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    const secondPage = await context.newPage();
    try {
      await goHome(secondPage);
      await goToLocalFavorites(secondPage);

      await expect(secondPage.getByText(resourceName).first()).toBeVisible({
        timeout: ASYNC_UI_TIMEOUT_MS,
      });
    } finally {
      await secondPage.close();
    }
  });
});
