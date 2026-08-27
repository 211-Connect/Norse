import { existsSync } from 'node:fs';

import {
  addFirstResultToList,
  closeFavoritesDialog,
  closeShareDialog,
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
  openShareDialogAndGetShortUrl,
  openShortUrlInNewPage,
  removeFirstResourceFromListPage,
  removeFromListViaDialog,
  resetLocalFavoritesStorage,
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

  test('should show the empty state for a newly created list', async ({
    page,
  }) => {
    await goToFavorites(page);

    const listCard = page.getByText(listName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await expect(page.getByText(/nothing here yet/i)).toBeVisible({
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

  test('should cancel and then confirm clearing all favorites from the list', async ({
    page,
  }) => {
    await searchAndGetFirstResult(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });
    await addFirstResultToList(page, updatedListName);
    await closeFavoritesDialog(page);

    await goToFavorites(page);
    const listCard = page.getByText(updatedListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    await expect
      .poll(async () => page.getByTestId('remove-from-list-btn').count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
      })
      .toBeGreaterThan(0);

    // Cancel path: the confirm dialog closes and favorites are untouched.
    await page.getByTestId('purge-list-btn').click();
    const purgeDialog = page.getByRole('dialog');
    await expect(purgeDialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await purgeDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(purgeDialog).toHaveCount(0, { timeout: UI_SHELL_TIMEOUT_MS });

    await expect(page.getByTestId('remove-from-list-btn').first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    // Confirm path: all favorites are cleared.
    await page.getByTestId('purge-list-btn').click();
    await expect(page.getByTestId('purge-list-confirm-btn')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await page.getByTestId('purge-list-confirm-btn').click();

    await expect(page.getByText('All favorites cleared')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    await expect
      .poll(
        async () => {
          const count = await page.getByTestId('remove-from-list-btn').count();
          if (count > 0) {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await waitForFavoriteListPage(page);
          }
          return count;
        },
        { timeout: ASYNC_UI_TIMEOUT_MS, intervals: [250, 500, 1_000, 2_000] },
      )
      .toBe(0);
  });

  test('should cancel deleting the favorite list', async ({ page }) => {
    await goToFavorites(page);

    const card = page.getByTestId('favorite-list-card').filter({
      has: page.getByRole('link', { name: updatedListName, exact: true }),
    });
    await expect(card).toHaveCount(1, { timeout: UI_SHELL_TIMEOUT_MS });

    await card.getByTestId('delete-list-btn').click();

    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await deleteDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(deleteDialog).toHaveCount(0, { timeout: UI_SHELL_TIMEOUT_MS });

    await expect(page.getByText(updatedListName).first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('should delete the favorite list', async ({ page }) => {
    await goToFavorites(page);

    await deleteFavoriteList(page, updatedListName);

    const removedCard = page.getByText(updatedListName);

    await expect(removedCard).toHaveCount(0, {
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });

  test('should allow anonymous access to a public favorite list via its share link', async ({
    page,
    browser,
  }) => {
    await goToFavorites(page);

    const publicListName = `E2E Public Share List ${runId}`;

    const createListBtn = page.getByTestId('create-list-btn');
    await expect(createListBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await createListBtn.click();

    await page.locator('#name').fill(publicListName);
    // Make the list public at creation time so the share button (only
    // rendered for FavoriteListState.privacy === 'PUBLIC') is present as
    // soon as the list detail page loads.
    await page.locator('#public').click();

    const createListSubmitBtn = page.getByTestId('create-list-submit-btn');
    await expect(createListSubmitBtn).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await createListSubmitBtn.click();

    await expect(page.getByText('List created')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });

    const listCard = page.getByText(publicListName).first();
    await listCard.click();
    await waitForFavoriteListPage(page);

    const shortUrl = await openShareDialogAndGetShortUrl(page);
    await closeShareDialog(page);

    // Verify from a completely anonymous browser context — no cookies, no
    // session — that the share link is actually publicly reachable and is
    // rendered as a non-owner would see it (no owner-only actions).
    const anonymousContext = await browser.newContext({
      storageState: undefined,
    });
    try {
      const anonymousPage = await openShortUrlInNewPage(
        anonymousContext,
        shortUrl,
      );
      try {
        await waitForFavoriteListPage(anonymousPage, { asOwner: false });
        await expect(
          anonymousPage.getByText(publicListName).first(),
        ).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
        await expect(anonymousPage.getByTestId('edit-list-btn')).toHaveCount(0);
        await expect(
          anonymousPage.getByTestId('back-to-favorites'),
        ).toHaveCount(0);
      } finally {
        await anonymousPage.close();
      }
    } finally {
      await anonymousContext.close();
    }

    await goToFavorites(page);
    await deleteFavoriteList(page, publicListName);
    await expect(page.getByText(publicListName)).toHaveCount(0, {
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
  });

  test('should sync local favorites into the account on sign-in', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    try {
      await goHome(page);
      await resetLocalFavoritesStorage(page);

      await searchAndGetFirstResult(page, {
        query: 'clothing',
        query_label: 'clothing',
        query_type: 'text',
      });

      const favoriteBtn = page.getByTestId('favorite-btn').first();
      await expect(favoriteBtn).toHaveAttribute(
        'data-session-status',
        'unauthenticated',
        { timeout: UI_SHELL_TIMEOUT_MS },
      );
      await favoriteBtn.click();
      await expect(favoriteBtn.locator('svg')).toHaveClass(/fill-current/, {
        timeout: UI_SHELL_TIMEOUT_MS,
      });

      const storedIdsBeforeLogin = JSON.parse(
        (await page.evaluate(() =>
          window.localStorage.getItem('local-favorites'),
        )) ?? '[]',
      );
      expect(storedIdsBeforeLogin.length).toBeGreaterThan(0);

      await loginViaKeycloak(page);

      // `useSyncLocalFavoritesOnAuth` only clears local favorites after the
      // server-side sync succeeds — on failure it deliberately keeps them for
      // a future retry (see the hook's catch block). An emptied local-favorites
      // key is therefore proof the sync completed, regardless of whether it
      // created a new list or merged into an existing one server-side.
      await expect
        .poll(
          async () => {
            const raw = await page.evaluate(() =>
              window.localStorage.getItem('local-favorites'),
            );
            return JSON.parse(raw ?? '[]').length;
          },
          { timeout: ASYNC_UI_TIMEOUT_MS },
        )
        .toBe(0);

      // Authenticated users have no local list — favorites navigation now
      // goes straight to the real account favorites page instead of
      // /favorites/local.
      await goToFavorites(page);
      await expect(page.getByTestId('favorite-list-card').first()).toBeVisible({
        timeout: ASYNC_UI_TIMEOUT_MS,
      });
    } finally {
      await context.close();
    }
  });
});
