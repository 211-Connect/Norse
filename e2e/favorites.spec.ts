import {
  test,
  expect,
  performSearch,
  goToFavorites,
  loginViaKeycloak,
  goHome,
} from './helpers';

const hasAuth =
  (!!process.env.TEST_USER_EMAIL || !!process.env.TEST_USER_USERNAME) &&
  !!process.env.TEST_USER_PASSWORD;

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

    await page.getByRole('button', { name: 'Create a list' }).click();

    await page.locator('#name').fill(listName);
    await page.locator('#description').fill(listDescription);

    await page.getByRole('button', { name: 'Create' }).click();

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

    const favoriteBtn = page.locator('button[aria-label="Favorite"]').first();
    await expect(favoriteBtn).toBeVisible({ timeout: 30_000 });
    await favoriteBtn.click();

    await expect(page.getByText('Search your lists')).toBeVisible({
      timeout: 10_000,
    });

    const searchBar = page.getByPlaceholder('Search your lists');
    await expect(searchBar).toBeVisible({ timeout: 5000 });
    await searchBar.fill(listName);

    const listRow = page.getByText(listName).first();
    await expect(listRow).toBeVisible({ timeout: 5000 });

    const row = listRow.locator('..');
    const addBtn = row.locator('button[aria-label="Add to list"]');
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
    } else {
      await page.locator('button[aria-label="Add to list"]').first().click();
    }

    await expect(page.getByText('Added to list')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Close' }).click();

    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();

    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(listName).first()).toBeVisible();
    await expect(page.getByText(listDescription).first()).toBeVisible();
    await expect(page.getByText('Back to favorites')).toBeVisible();
  });

  test('should update the favorite list name and description', async ({
    page,
  }) => {
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();
    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    let editClicked = false;

    const headerButtons = page
      .locator('.flex.gap-2 button[variant="outline"], .flex.gap-2 button')
      .first();
    if (await headerButtons.isVisible().catch(() => false)) {
      await headerButtons.click();
      editClicked = true;
    }

    if (!editClicked) {
      const allButtons = page.getByRole('button');
      const count = await allButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const label = await btn.textContent();
        if (label?.trim() === '' || label === null) {
          await btn.click();
          const updateDialog = page.getByText('Update list');
          if (
            await updateDialog.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            editClicked = true;
            break;
          }
        }
      }
    }

    expect(editClicked).toBeTruthy();

    await expect(page.getByText('Update list')).toBeVisible({
      timeout: 5000,
    });

    const nameInput = page.locator('#name');
    await nameInput.clear();
    await nameInput.fill(updatedListName);

    const descInput = page.locator('#description');
    await descInput.clear();
    await descInput.fill(updatedDescription);

    await page.getByRole('button', { name: 'Update' }).click();

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
    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const removeTriggers = page.locator(
      'button.size-6, button[class*="size-6"]',
    );
    await expect(removeTriggers.first()).toBeVisible({ timeout: 10_000 });
    await removeTriggers.first().click();

    await expect(
      page.getByText(
        'Are you sure you want to remove this favorite from your list?',
      ),
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Delete' }).click();

    await page.waitForLoadState('networkidle');
    const resourceLinks = page.locator('#search-container a[href*="/search/"]');
    await expect(resourceLinks).toHaveCount(0, { timeout: 10_000 });
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    const updatedCard = page.getByText(updatedListName).first();
    await updatedCard.click();
    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const iconButtons = page.locator('.flex.gap-2 button');
    const count = await iconButtons.count();
    let deleteDialogOpened = false;

    for (let i = 0; i < count; i++) {
      await iconButtons.nth(i).click();

      const deleteTitle = page
        .getByText('Delete', { exact: false })
        .filter({ hasText: '?' });
      if (await deleteTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
        deleteDialogOpened = true;
        await page.getByRole('button', { name: 'Delete' }).click();
        await page.waitForURL(/\/favorites$/, { timeout: 15000 });
        break;
      }

      const cancelBtn = page.getByRole('button', { name: 'Cancel' });
      if (await cancelBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    expect(deleteDialogOpened).toBeTruthy();

    await goToFavorites(page);
    await page.waitForLoadState('networkidle');

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, { timeout: 5000 });
  });
});
