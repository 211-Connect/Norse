import { type Page } from '@playwright/test';

import {
  expect,
  expectPageUrl,
  goHome,
  goToLocalFavorites,
  performSearch,
  resetLocalFavoritesStorage,
  searchAndGetFirstResult,
  test,
} from './helpers';
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Favorites the search result at `index` in the currently rendered results
 * list (search must already have been performed) and returns its name.
 */
async function addSearchResultAtIndexToLocalFavorites(
  page: Page,
  index: number,
) {
  const favoriteBtn = page.getByTestId('favorite-btn').nth(index);
  const resourceLink = page.getByTestId('resource-link').nth(index);

  await expect(favoriteBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await expect(favoriteBtn).toHaveAttribute(
    'data-session-status',
    'unauthenticated',
    {
      timeout: UI_SHELL_TIMEOUT_MS,
    },
  );

  const resourceName = ((await resourceLink.textContent()) ?? '').trim();

  await favoriteBtn.click();

  await expect(favoriteBtn.locator('svg')).toHaveClass(/fill-current/, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  return { resourceName };
}

async function addFirstSearchResultToLocalFavorites(
  page: Page,
  query: string,
  queryLabel: string,
) {
  await searchAndGetFirstResult(page, {
    query,
    query_label: queryLabel,
    query_type: 'text',
  });

  return addSearchResultAtIndexToLocalFavorites(page, 0);
}

/**
 * Navigates to the local favorites page and asserts `resourceName` is
 * listed there.
 */
async function expectResourceInLocalFavorites(
  page: Page,
  resourceName: string,
) {
  await goToLocalFavorites(page);

  await expect(page.getByText(resourceName).first()).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/**
 * Polls the local favorites page's `remove-from-list-btn` count until it's
 * empty (`toBe: 0`) or has at least one entry (`toBe: 'non-empty'`).
 */
async function expectLocalFavoritesButtonCount(
  page: Page,
  toBe: 0 | 'non-empty',
) {
  const poll = expect.poll(
    async () => page.getByTestId('remove-from-list-btn').count(),
    { timeout: ASYNC_UI_TIMEOUT_MS },
  );

  if (toBe === 0) {
    await poll.toBe(0);
  } else {
    await poll.toBeGreaterThan(0);
  }
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

    await expectResourceInLocalFavorites(page, resourceName);

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

    await expectResourceInLocalFavorites(page, resourceName);

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

    await expectResourceInLocalFavorites(page, resourceName);

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
    // Favorite two distinct results from a single result set. Using two
    // separate queries here previously could return the same pinned
    // resource as the first result for both, in which case the second
    // "favorite" click would toggle it back off instead of adding a second
    // favorite, leaving only one favorite behind.
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });
    await addSearchResultAtIndexToLocalFavorites(page, 0);
    await addSearchResultAtIndexToLocalFavorites(page, 1);

    await goToLocalFavorites(page);

    await expectLocalFavoritesButtonCount(page, 'non-empty');

    await expect(page.getByTestId('purge-local-list-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    // Cancel path: the confirm dialog closes and favorites are untouched.
    await page.getByTestId('purge-local-list-btn').click();
    const purgeDialog = page.getByRole('dialog');
    await expect(purgeDialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await purgeDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(purgeDialog).toHaveCount(0, { timeout: UI_SHELL_TIMEOUT_MS });

    await expectLocalFavoritesButtonCount(page, 'non-empty');

    // Confirm path: all favorites are cleared.
    await page.getByTestId('purge-local-list-btn').click();

    await expect(page.getByTestId('purge-list-confirm-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await page.getByTestId('purge-list-confirm-btn').click();

    await expectLocalFavoritesButtonCount(page, 0);

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

    await expectLocalFavoritesButtonCount(page, 0);
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

    await expectResourceInLocalFavorites(page, resourceName);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    const secondPage = await context.newPage();
    try {
      await goHome(secondPage);
      await expectResourceInLocalFavorites(secondPage, resourceName);
    } finally {
      await secondPage.close();
    }
  });
});
