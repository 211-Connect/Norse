import { type Page } from '@playwright/test';

import {
  expect,
  expectPageUrl,
  goHome,
  goToLocalFavorites,
  resetLocalFavoritesStorage,
  searchAndGetFirstResult,
  test,
} from './helpers';
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

async function addFirstSearchResultToLocalFavorites(
  page: Page,
  query: string,
  queryLabel: string,
) {
  const { name: firstResourceName } = await searchAndGetFirstResult(page, {
    query,
    query_label: queryLabel,
    query_type: 'text',
  });

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

  await expect(favoriteBtn.locator('svg')).toHaveClass(/fill-current/, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });

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

  test('should show the empty state when there are no local favorites', async ({
    page,
  }) => {
    await goToLocalFavorites(page);

    await expect(page.getByTestId('purge-local-list-btn')).toHaveCount(0);
    await expect(page.getByText('No saved resources yet')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
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

  test('should keep a local favorite when the remove confirmation is cancelled', async ({
    page,
  }) => {
    const { resourceName } = await addFirstSearchResultToLocalFavorites(
      page,
      'shelter',
      'shelter',
    );

    await goToLocalFavorites(page);

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await page.getByTestId('remove-from-list-btn').first().click();

    const removeDialog = page.getByRole('dialog');
    await expect(removeDialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await removeDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(removeDialog).toHaveCount(0, { timeout: UI_SHELL_TIMEOUT_MS });

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
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

    // Cancel path: the confirm dialog closes and favorites are untouched.
    await page.getByTestId('purge-local-list-btn').click();
    const purgeDialog = page.getByRole('dialog');
    await expect(purgeDialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await purgeDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(purgeDialog).toHaveCount(0, { timeout: UI_SHELL_TIMEOUT_MS });

    await expect
      .poll(async () => page.getByTestId('remove-from-list-btn').count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
      })
      .toBeGreaterThan(0);

    // Confirm path: all favorites are cleared.
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
    const { link: resourceLink } = await searchAndGetFirstResult(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });
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

    // Local (unauthenticated) favoriting toggles synchronously via localStorage
    // and reflects on the button's Heart icon fill — assert the "added" state
    // before toggling again, rather than firing two clicks back-to-back with
    // no signal between them (previously timing-fragile / ambiguous intent).
    await expect(favoriteBtn.locator('svg')).toHaveClass(/fill-current/, {
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    await favoriteBtn.click();

    await expect(favoriteBtn.locator('svg')).not.toHaveClass(/fill-current/, {
      timeout: UI_SHELL_TIMEOUT_MS,
    });

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
