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

  // Store resource name for validation
  let firstResourceName = '';

  test('should create a new favorite list', async ({ page }) => {
    await goToFavorites(page);

    const createListBtn = page.getByTestId('create-list-btn');
    await expect(createListBtn).toBeVisible({ timeout: 10_000 });
    await createListBtn.click();

    await page.locator('#name').fill(listName);
    await page.locator('#description').fill(listDescription);

    const createListSubmitBtn = page.getByTestId('create-list-submit-btn');
    await expect(createListSubmitBtn).toBeVisible({ timeout: 10_000 });
    await createListSubmitBtn.click();

    await expect(page.getByText('List created')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(listName)).toBeVisible({ timeout: 10000 });
  });

  test('should add a resource to the favorite list from search results', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 10_000 });

    // Get the first resource name for later validation
    const firstResourceLink = page.getByTestId('resource-link').first();
    await expect(firstResourceLink).toBeVisible({ timeout: 30_000 });
    firstResourceName = (await firstResourceLink.textContent()) || '';

    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await expect(favoriteBtn).toBeVisible({ timeout: 30_000 });
    await favoriteBtn.click();

    // Wait for the dialog to load (skeleton disappears)
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('favorites-list-loaded')).toBeAttached({
      timeout: 10_000,
    });

    const searchBar = page.getByTestId('favorites-search-input');
    await expect(searchBar).toBeVisible({ timeout: 10_000 });
    await searchBar.fill(listName);

    // Wait for debounce and filtering to complete
    await page.waitForTimeout(5000);
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });

    const listRow = page.getByText(listName).first();
    await expect(listRow).toBeVisible({ timeout: 10_000 });

    const addBtn = page.getByTestId('add-to-list-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    // Verify the resource is now marked as in the list (HeartOff icon)
    const removeBtn = page.getByTestId('remove-from-list-btn').first();
    await expect(removeBtn).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Close' }).click();

    // Navigate to the favorites list and verify the resource is there
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();

    await waitForFavoriteListPage(page);
    await expect(page.getByText(listName).first()).toBeVisible();
    await expect(page.getByText(listDescription).first()).toBeVisible();
    await expect(page.getByText(firstResourceName).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should update the favorite list name and description', async ({
    page,
  }) => {
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    const editBtn = page.getByTestId('edit-list-btn');
    await expect(editBtn).toBeVisible({ timeout: 10_000 });
    await editBtn.click();

    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(updatedListName);

    const descInput = page.locator('#description');
    await descInput.fill(updatedDescription);

    const updateListSubmitBtn = page.getByTestId('update-list-submit-btn');
    await expect(updateListSubmitBtn).toBeVisible({ timeout: 10_000 });
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

  test('should remove a resource from the favorite list using the remove button', async ({
    page,
  }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await waitForFavoriteListPage(page);

    // Verify the resource is present before removal
    await expect(page.getByText(firstResourceName).first()).toBeVisible({
      timeout: 10_000,
    });

    const removeTrigger = page.getByTestId('remove-from-list-btn').first();
    await expect(removeTrigger).toBeVisible({ timeout: 10_000 });
    await removeTrigger.click();

    const removeButton = page.getByTestId(
      'remove-from-current-list-confirm-btn',
    );
    await expect(removeButton).toBeVisible({ timeout: 10_000 });
    await removeButton.click();

    await expect(page.getByText('Removed from list')).toBeVisible({
      timeout: 10_000,
    });

    await page.waitForLoadState('networkidle');

    // Verify the specific resource is no longer visible (more resilient than checking count)
    await expect(page.getByText(firstResourceName)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test('should add a resource from search results and remove it via dialog', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'housing',
      query_label: 'housing',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 10_000 });

    // Get resource name
    const resourceLink = page.getByTestId('resource-link').first();
    await expect(resourceLink).toBeVisible({ timeout: 30_000 });
    const resourceName = (await resourceLink.textContent()) || '';

    // Add to list
    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await favoriteBtn.click();

    // Wait for the dialog to load
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('favorites-list-loaded')).toBeAttached({
      timeout: 10_000,
    });

    const searchBar = page.getByTestId('favorites-search-input');
    await expect(searchBar).toBeVisible({ timeout: 10_000 });
    await searchBar.fill(updatedListName);

    // Wait for debounce and filtering to complete
    await page.waitForTimeout(5000);
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });

    const addBtn = page.getByTestId('add-to-list-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    // Now remove it from dialog (HeartOff button)
    const removeFromListBtn = page.getByTestId('remove-from-list-btn').first();
    await expect(removeFromListBtn).toBeVisible({ timeout: 10_000 });
    await removeFromListBtn.click();

    await expect(page.getByText('Removed from list')).toBeVisible({
      timeout: 10_000,
    });

    // Close dialog
    await page.getByRole('button', { name: 'Close' }).click();

    // Verify it's not in the list
    await goToFavorites(page);
    const listCard = page.getByText(updatedListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await expect(page.getByText(resourceName)).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test('should add a resource from resource details page', async ({ page }) => {
    await performSearch(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 10_000 });

    // Click on first resource to go to details page
    const firstResourceLink = page.getByTestId('resource-link').first();
    await expect(firstResourceLink).toBeVisible({ timeout: 30_000 });
    const resourceName = (await firstResourceLink.textContent()) || '';
    await firstResourceLink.click();

    // Wait for resource page to load
    await page.waitForURL(/search\/[a-f0-9-]{36}/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Add to favorites from resource page
    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await expect(favoriteBtn).toBeVisible({ timeout: 10_000 });
    await favoriteBtn.click();

    // Wait for the dialog to load
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('favorites-list-loaded')).toBeAttached({
      timeout: 10_000,
    });

    const searchBar = page.getByTestId('favorites-search-input');
    await expect(searchBar).toBeVisible({ timeout: 10_000 });
    await searchBar.fill(updatedListName);

    // Wait for debounce and filtering to complete
    await page.waitForTimeout(5000);
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });

    const addBtn = page.getByTestId('add-to-list-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();

    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Close' }).click();

    // Verify it's in the list
    await goToFavorites(page);
    const listCard = page.getByText(updatedListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await expect(page.getByText(resourceName).first()).toBeVisible({
      timeout: 10_000,
    });

    // Clean up - remove it
    const removeTrigger = page.getByTestId('remove-from-list-btn').first();
    await removeTrigger.click();
    const removeButton = page.getByTestId(
      'remove-from-current-list-confirm-btn',
    );
    await removeButton.click();
    await expect(page.getByText('Removed from list')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should show correct state in favorites dialog (in list vs not in list)', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 10_000 });

    const favoriteBtn = page.getByTestId('favorite-btn').first();
    await favoriteBtn.click();

    // Wait for the dialog to load
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('favorites-list-loaded')).toBeAttached({
      timeout: 10_000,
    });

    const searchBar = page.getByTestId('favorites-search-input');
    await expect(searchBar).toBeVisible({ timeout: 10_000 });
    await searchBar.fill(updatedListName);

    // Wait for debounce and filtering to complete
    await page.waitForTimeout(5000);
    await expect(
      page.getByTestId('favorites-loading-skeleton'),
    ).not.toBeVisible({ timeout: 10_000 });

    // Should show "Add to list" button initially (resource not in list)
    const addBtn = page.getByTestId('add-to-list-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    // Add it
    await addBtn.click();
    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    // Should now show "Remove from list" button (resource is in list)
    const removeBtn = page.getByTestId('remove-from-list-btn').first();
    await expect(removeBtn).toBeVisible({ timeout: 10_000 });

    // Remove it
    await removeBtn.click();
    await expect(page.getByText('Removed from list')).toBeVisible({
      timeout: 10_000,
    });

    // Should show "Add to list" button again
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await waitForFavoriteListPage(page);

    const deleteListBtn = page.getByTestId('delete-list-btn');
    await expect(deleteListBtn).toBeVisible({ timeout: 10_000 });
    await deleteListBtn.click();

    const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
    await expect(deleteListConfirmBtn).toBeVisible({ timeout: 10_000 });
    await deleteListConfirmBtn.click();
    await page.waitForLoadState('networkidle');

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, { timeout: 10_000 });
  });
});
