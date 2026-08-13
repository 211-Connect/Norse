import { existsSync } from 'node:fs';

import {
  addFirstResultToList,
  closeFavoritesDialog,
  deleteFavoriteList,
  editFavoriteList,
  expect,
  expectAuthenticatedShell,
  expectPageUrl,
  getFavoritesDialogListActionButton,
  goHome,
  goToFavorites,
  loginViaKeycloak,
  openFavoritesDialogForList,
  removeFirstResourceFromListPage,
  removeFromListViaDialog,
  searchAndGetFirstResult,
  test,
  waitForFavoriteListPage,
  waitForFavoriteOnListPage,
  waitForFavoriteToBeAbsentOnListPage,
} from './helpers';
import { AUTH_STORAGE_STATE_PATH, hasTestCredentials } from './env';
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

const hasAuth = hasTestCredentials;

test.describe('Favorites Feature (Authenticated)', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    !hasAuth,
    'Skipped — no test credentials (set TEST_USER_EMAIL & TEST_USER_PASSWORD)',
  );

  test.use({
    storageState: hasAuth ? AUTH_STORAGE_STATE_PATH : undefined,
  });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await loginViaKeycloak(page);
      // Explicit, visible guard right before any destructive action — not
      // just relying on the assertion buried inside `loginViaKeycloak`,
      // which future refactors could weaken or move without this call site
      // noticing.
      await expectAuthenticatedShell(page);
      await context.storageState({ path: AUTH_STORAGE_STATE_PATH });
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!existsSync(AUTH_STORAGE_STATE_PATH)) {
      throw new Error(
        `Skipping afterAll cleanup — no saved session at ${AUTH_STORAGE_STATE_PATH}. ` +
          'This means beforeAll failed before logging in; see its error above for the real cause.',
      );
    }

    const context = await browser.newContext({
      storageState: AUTH_STORAGE_STATE_PATH,
    });
    const page = await context.newPage();
    try {
      await expectAuthenticatedShell(page);
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const listName = `E2E Test List ${runId}`;
  const listDescription = 'Created by Playwright E2E test';
  const updatedListName = `${listName} (Updated)`;
  const updatedDescription = 'Updated by Playwright E2E test';

  // Store resource name for validation
  let firstResourceName = '';

  test('should create a new favorite list', async ({ page }) => {
    await goToFavorites(page);

    const createListBtn = page.getByTestId('create-list-btn');
    await expect(createListBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await createListBtn.click();

    await page.locator('#name').fill(listName);
    await page.locator('#description').fill(listDescription);

    const createListSubmitBtn = page.getByTestId('create-list-submit-btn');
    await expect(createListSubmitBtn).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await createListSubmitBtn.click();

    await expect(page.getByText('List created')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await expect(page.getByText(listName)).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });

  test('should add a resource to the favorite list from search results', async ({
    page,
  }) => {
    const { name } = await searchAndGetFirstResult(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });
    firstResourceName = name;

    await addFirstResultToList(page, listName);
    await closeFavoritesDialog(page);

    // Navigate to the favorites list and verify the resource is there
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();

    await waitForFavoriteListPage(page);
    await expect(page.getByText(listName).first()).toBeVisible();
    await expect(page.getByText(listDescription).first()).toBeVisible();
    // await waitForFavoriteOnListPage(page, firstResourceName);
  });

  test('should update the favorite list name and description', async ({
    page,
  }) => {
    await goToFavorites(page);

    await editFavoriteList(page, listName, {
      name: updatedListName,
      description: updatedDescription,
    });

    await expect(page.getByText('Updated list')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await expect(page.getByText(updatedListName).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
    await expect(page.getByText(updatedDescription).first()).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });

  test('should remove a resource from the favorite list using the remove button', async ({
    page,
  }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await waitForFavoriteListPage(page);

    // Verify the resource is present before removal
    await waitForFavoriteOnListPage(page, firstResourceName);

    await removeFirstResourceFromListPage(page);

    // Verify the specific resource is no longer visible (more resilient than checking count)
    await waitForFavoriteToBeAbsentOnListPage(page, firstResourceName);
  });

  test('should add a resource from search results and remove it via dialog', async ({
    page,
  }) => {
    const { name: resourceName } = await searchAndGetFirstResult(page, {
      query: 'housing',
      query_label: 'housing',
      query_type: 'text',
    });

    await addFirstResultToList(page, updatedListName);
    await removeFromListViaDialog(page, updatedListName);

    // Close dialog
    await closeFavoritesDialog(page);

    // Verify it's not in the list
    await goToFavorites(page);
    const listCard = page.getByText(updatedListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await waitForFavoriteToBeAbsentOnListPage(page, resourceName);
  });

  test('should add a resource from resource details page', async ({ page }) => {
    const { link: firstResourceLink } = await searchAndGetFirstResult(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });
    const resourceName = (await firstResourceLink.textContent()) || '';
    await firstResourceLink.click();

    // Wait for resource page to load
    await expectPageUrl(page, /search\/[a-f0-9-]{36}/);
    await expect(page.getByTestId('favorite-btn').first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    // Add to favorites from resource page
    await addFirstResultToList(page, updatedListName);
    await closeFavoritesDialog(page);

    // Verify it's in the list
    await goToFavorites(page);
    const listCard = page.getByText(updatedListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await waitForFavoriteOnListPage(page, resourceName);

    // Clean up - remove it
    await removeFirstResourceFromListPage(page);
  });

  test('should show correct state in favorites dialog (in list vs not in list)', async ({
    page,
  }) => {
    await searchAndGetFirstResult(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await openFavoritesDialogForList(page, updatedListName);

    // Should show "Add to list" button initially (resource not in list)
    const addBtn = await getFavoritesDialogListActionButton(
      page,
      updatedListName,
      'add-to-list-btn',
    );

    // Add it
    await addBtn.click();
    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    // Remove it
    await removeFromListViaDialog(page, updatedListName);

    // Should show "Add to list" button again
    await expect(addBtn).toBeVisible({ timeout: ASYNC_UI_TIMEOUT_MS });

    await closeFavoritesDialog(page);
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    await deleteFavoriteList(page, updatedListName);

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, {
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });
});
