import {
  test,
  expect,
  performSearch,
  goToFavorites,
  waitForFavoriteListPage,
  loginViaKeycloak,
  goHome,
} from './helpers';

const hasAuth =
  !!process.env.TEST_USER_EMAIL && !!process.env.TEST_USER_PASSWORD;

test.describe('Favorites Feature (Authenticated)', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    !hasAuth,
    'Skipped — no test credentials (set TEST_USER_EMAIL & TEST_USER_PASSWORD)',
  );

  test.beforeEach(async ({ page }) => {
    await loginViaKeycloak(page);
    await goHome(page);
  });

  const listName = `E2E Test List ${Date.now()}`;
  const listDescription = 'Created by Playwright E2E test';
  const updatedListName = `${listName} (Updated)`;
  const updatedDescription = 'Updated by Playwright E2E test';

  test('should create a new favorite list', async ({ page }) => {
    await goToFavorites(page);

    const createListBtn = page.getByTestId('create-list-btn');
    await expect(createListBtn).toBeVisible({ timeout: 5000 });
    await createListBtn.click();

    await page.locator('#name').fill(listName);
    await page.locator('#description').fill(listDescription);

    const createListSubmitBtn = page.getByTestId('create-list-submit-btn');
    await expect(createListSubmitBtn).toBeVisible({ timeout: 5000 });
    await createListSubmitBtn.click();

    await expect(page.getByText('List created')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(listName)).toBeVisible({ timeout: 10000 });
  });

  test('should add a resource to the favorite list', async ({ page }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 5000 });

    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await expect(favoriteBtn).toBeVisible({ timeout: 30_000 });
    await favoriteBtn.click();

    const searchBar = page.getByTestId('favorites-search-input');
    await expect(searchBar).toBeVisible({ timeout: 10_000 });
    await searchBar.fill(listName);

    const listRow = page.getByText(listName).first();
    await expect(listRow).toBeVisible({ timeout: 5000 });

    const addBtn = page.getByTestId('add-to-list-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Close' }).click();

    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();

    await waitForFavoriteListPage(page);
    await expect(page.getByText(listName).first()).toBeVisible();
    await expect(page.getByText(listDescription).first()).toBeVisible();
    await waitForFavoriteListPage(page);
  });

  test('should update the favorite list name and description', async ({
    page,
  }) => {
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    const editBtn = page.getByTestId('edit-list-btn');
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(updatedListName);

    const descInput = page.locator('#description');
    await descInput.fill(updatedDescription);

    const updateListSubmitBtn = page.getByTestId('update-list-submit-btn');
    await expect(updateListSubmitBtn).toBeVisible({ timeout: 5000 });
    await updateListSubmitBtn.click();

    await expect(page.getByText('Updated list')).toBeVisible({
      timeout: 10000,
    });

    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updatedListName).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(updatedDescription).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should remove a resource from the favorite list', async ({ page }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await waitForFavoriteListPage(page);

    const removeTrigger = page.getByTestId('remove-favorite-btn').first();
    await expect(removeTrigger).toBeVisible({ timeout: 10_000 });
    await removeTrigger.click();

    const removeButton = page.getByTestId('remove-favorite-confirm-btn');
    await expect(removeButton).toBeVisible({ timeout: 5000 });
    await removeButton.click();

    await page.waitForLoadState('networkidle');
    const resourceLinks = page.getByTestId('resource-link');
    await expect(resourceLinks).toHaveCount(0, { timeout: 10_000 });
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await waitForFavoriteListPage(page);

    const deleteListBtn = page.getByTestId('delete-list-btn');
    await expect(deleteListBtn).toBeVisible({ timeout: 5000 });
    await deleteListBtn.click();

    const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
    await expect(deleteListConfirmBtn).toBeVisible({ timeout: 5000 });
    await deleteListConfirmBtn.click();
    await page.waitForLoadState('networkidle');

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, { timeout: 5000 });
  });
});
