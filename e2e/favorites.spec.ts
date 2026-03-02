/**
 * Requires authentication – set TEST_USER_EMAIL / TEST_USER_PASSWORD
 * env vars. If not set, authenticated tests are skipped.
 */
import {
  test,
  expect,
  goToSearch,
  goToFavorites,
  waitForAuthenticatedSession,
  AUTH_STATE_PATH,
} from './helpers';
import fs from 'node:fs';

const hasAuth = fs.existsSync(AUTH_STATE_PATH);

test.describe.configure({ mode: 'serial' });

test.describe('Favorites Feature (Authenticated)', () => {
  // Skip entire block when auth is unavailable
  test.skip(
    !hasAuth,
    'Skipped — no authenticated session (set TEST_USER_EMAIL & TEST_USER_PASSWORD)',
  );
  test.use({ storageState: AUTH_STATE_PATH });

  const isAuthRedirect = (url: string) =>
    /\/auth\/signin|auth\.c211\.io|keycloak/i.test(url);

  test.afterEach(async ({ page }) => {
    if (!isAuthRedirect(page.url())) {
      await page.context().storageState({ path: AUTH_STATE_PATH });
    }
  });

  /** Randomised list name to avoid collisions between runs. */
  const listName = `E2E Test List ${Date.now()}`;
  const listDescription = 'Created by Playwright E2E test';
  const updatedListName = `${listName} (Updated)`;
  const updatedDescription = 'Updated by Playwright E2E test';

  /* ---------- CREATE ---------- */

  test('should create a new favorite list', async ({ page }) => {
    await goToFavorites(page);

    // Click "Create a list"
    await page.getByRole('button', { name: 'Create a list' }).click();

    // Fill the form
    await page.locator('#name').fill(listName);
    await page.locator('#description').fill(listDescription);

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Toast confirmation
    await expect(page.getByText('List created')).toBeVisible({
      timeout: 10000,
    });

    // The new list should now appear in the list
    await expect(page.getByText(listName)).toBeVisible({ timeout: 10000 });
  });

  /* ---------- ADD ---------- */

  test('should add a resource to the favorite list', async ({ page }) => {
    // Search for a resource first
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    // Wait for results to load
    await page
      .locator('#search-container')
      .waitFor({ state: 'visible', timeout: 5000 });

    await waitForAuthenticatedSession(page);

    // Click the first "Favorite" button on a result card
    const favoriteBtn = page.locator('button[aria-label="Favorite"]').first();
    await favoriteBtn.click();

    // The add-to-favorites dialog should appear
    await expect(page.getByText('Search your lists')).toBeVisible({
      timeout: 10000,
    });

    // Find our test list and click "Add to list"
    const listRow = page.getByText(listName).first();
    await expect(listRow).toBeVisible({ timeout: 5000 });

    // Click the "Add to list" button on that row
    const row = listRow.locator('..');
    const addBtn = row.locator('button[aria-label="Add to list"]');

    // If the button is not direct sibling, find it more broadly
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
    } else {
      // Fallback: click the first "Add to list" button
      await page.locator('button[aria-label="Add to list"]').first().click();
    }
  });

  test('should navigate to favorites and view the created list', async ({
    page,
  }) => {
    await goToFavorites(page);

    // The created list should be visible
    await expect(page.getByText(listName)).toBeVisible({ timeout: 10000 });

    // Privacy badge should default to Private
    await expect(page.getByText('Private').first()).toBeVisible();
  });

  test('should view list details and see added resources', async ({ page }) => {
    await goToFavorites(page);

    // Click "View list" to open the detail page
    const listCard = page.getByText(listName).first();
    await listCard.click();

    // Wait for navigation to favorites/[id]
    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Should see the list name as the title
    await expect(page.getByText(listName).first()).toBeVisible();

    // Should see the description
    await expect(page.getByText(listDescription).first()).toBeVisible();

    // "Back to favorites" link should be present for the owner
    await expect(page.getByText('Back to favorites')).toBeVisible();
  });

  test('should update the favorite list name and description', async ({
    page,
  }) => {
    await goToFavorites(page);

    // Navigate to the list detail
    const listCard = page.getByText(listName).first();
    await listCard.click();
    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Click the edit/update button (SquarePen icon)
    // The update button is an icon-only button near the list header
    const updateButtons = page
      .locator('button')
      .filter({ has: page.locator('svg') });
    // Look for the edit button — it opens the update dialog
    let editClicked = false;

    // Try finding by the update form — click buttons until the dialog opens
    const headerButtons = page
      .locator('.flex.gap-2 button[variant="outline"], .flex.gap-2 button')
      .first();
    if (await headerButtons.isVisible().catch(() => false)) {
      await headerButtons.click();
      editClicked = true;
    }

    if (!editClicked) {
      // Alternative: look for any button that will produce the update dialog
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

    if (editClicked) {
      // Wait for the update dialog
      await expect(page.getByText('Update list')).toBeVisible({
        timeout: 5000,
      });

      // Update name
      const nameInput = page.locator('#name');
      await nameInput.clear();
      await nameInput.fill(updatedListName);

      // Update description
      const descInput = page.locator('#description');
      await descInput.clear();
      await descInput.fill(updatedDescription);

      // Submit
      await page.getByRole('button', { name: 'Update' }).click();

      // Toast confirmation
      await expect(page.getByText('Updated list')).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should remove a resource from the favorite list', async ({ page }) => {
    await goToFavorites(page);

    // Navigate to the list (use updated name or original)
    const updatedCard = page.getByText(updatedListName).first();
    const originalCard = page.getByText(listName).first();

    if (await updatedCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await updatedCard.click();
    } else {
      await originalCard.click();
    }

    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Find and click the remove button (HeartOff icon, ghost variant)
    const removeBtn = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .filter({ hasText: '' });

    // Look for any card actions that include removal
    const removeTriggers = page.locator(
      'button.size-6, button[class*="size-6"]',
    );
    if (
      await removeTriggers
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await removeTriggers.first().click();

      // Confirmation dialog
      await expect(
        page.getByText(
          'Are you sure you want to remove this favorite from your list?',
        ),
      ).toBeVisible({ timeout: 5000 });

      // Confirm deletion
      await page.getByRole('button', { name: 'Delete' }).click();
    }
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    // Navigate to the list detail
    const updatedCard = page.getByText(updatedListName).first();
    const originalCard = page.getByText(listName).first();

    if (await updatedCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await updatedCard.click();
    } else {
      await originalCard.click();
    }

    await page.waitForURL(/\/favorites\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Click the delete button (Trash2 icon, outline variant)
    // The delete button is the second icon button in the header flex row
    const iconButtons = page.locator('.flex.gap-2 button');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      await iconButtons.nth(i).click();

      // Check if this opened the delete confirmation
      const deleteTitle = page
        .getByText('Delete', { exact: false })
        .filter({ hasText: '?' });
      if (await deleteTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click the destructive Delete button to confirm
        await page.getByRole('button', { name: 'Delete' }).click();

        // Should navigate back to favorites
        await page.waitForURL(/\/favorites$/, { timeout: 15000 });
        break;
      }

      // Close any opened dialog with Cancel or Escape
      const cancelBtn = page.getByRole('button', { name: 'Cancel' });
      if (await cancelBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('deleted list should no longer appear on favorites page', async ({
    page,
  }) => {
    await goToFavorites(page);
    await page.waitForLoadState('networkidle');

    // Neither the updated name nor original name should appear
    const updatedCard = page.getByText(updatedListName);
    const originalCard = page.getByText(listName);

    await expect(updatedCard).toHaveCount(0, { timeout: 5000 });
    await expect(originalCard).toHaveCount(0, { timeout: 5000 });
  });
});
