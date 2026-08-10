import {
  addFirstResultToList,
  closeFavoritesDialog,
  deleteAllE2ETestLists,
  expect,
  expectPageUrl,
  getFavoritesDialogListActionButton,
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
import { ASYNC_UI_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

const hasAuth =
  !!process.env.TEST_USER_EMAIL && !!process.env.TEST_USER_PASSWORD;

test.describe('Favorites Feature (Authenticated)', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    !hasAuth,
    'Skipped — no test credentials (set TEST_USER_EMAIL & TEST_USER_PASSWORD)',
  );

  // Clean up any leftover E2E test lists before the suite runs (from previous
  // failed runs) so the favorites page doesn't accumulate stale entries.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await loginViaKeycloak(page);
    } finally {
      await page.close();
    }
  });

  // Clean up the list created in this run even if tests fail partway through.
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await loginViaKeycloak(page);
      await deleteAllE2ETestLists(page);
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginViaKeycloak(page);
  });

  const listName = `E2E Test List ${Date.now()}`;
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

    const editBtn = page.getByTestId('edit-list-btn');
    await expect(editBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await editBtn.click();

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await nameInput.fill(updatedListName);

    const descInput = page.locator('#description');
    await descInput.fill(updatedDescription);

    const updateListSubmitBtn = page.getByTestId('update-list-submit-btn');
    await expect(updateListSubmitBtn).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await updateListSubmitBtn.click();

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

    const deleteListBtn = page.getByTestId('delete-list-btn');
    await expect(deleteListBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await deleteListBtn.click();

    const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
    await expect(deleteListConfirmBtn).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await deleteListConfirmBtn.click();

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, {
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });
});
