import { type Page, expect } from '@playwright/test';

import {
  ASYNC_UI_TIMEOUT_MS,
  FAVORITES_PERSISTENCE_TIMEOUT_MS,
  PRESENCE_PROBE_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
  expectVisibleEventually,
} from '../timeouts';
import { isVisible } from './internal';
import { expectPageUrl } from './url';

export async function goToFavorites(page: Page) {
  // In client-side routing, URL can update without a new document "load".
  // Assert URL state directly and fail fast if auth gating opens a modal instead.
  const favoritesButton = page.getByTestId('favorites-btn');
  const authPrompt = page.getByRole('dialog', { name: /sign in required/i });

  await expect(favoritesButton).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await favoritesButton.click();

  await expect
    .poll(
      async () => {
        if (await isVisible(authPrompt)) return 'auth-required';

        return page.url().includes('/favorites') ? 'favorites' : 'pending';
      },
      {
        timeout: SEARCH_NAV_TIMEOUT_MS,
        message:
          'Expected favorites navigation, but the app either stayed put or opened the auth prompt.',
      },
    )
    .not.toBe('pending');

  if (await isVisible(authPrompt)) {
    throw new Error(
      'Favorites navigation was blocked by the "Sign in required" dialog. Ensure loginViaKeycloak() finishes with an authenticated app session before calling goToFavorites().',
    );
  }

  await expectPageUrl(page, (url) => url.pathname.includes('/favorites'));
  await expect(page.getByTestId('create-list-btn')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

export async function resetLocalFavoritesStorage(page: Page) {
  await page.evaluate(() => {
    window.localStorage.removeItem('local-favorites');
  });
}

export async function goToLocalFavorites(page: Page) {
  const favoritesButton = page.getByTestId('favorites-btn');
  const authPrompt = page.getByRole('dialog', { name: /sign in required/i });

  await expect(favoritesButton).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await favoritesButton.click();

  await expect
    .poll(
      async () => {
        if (await isVisible(authPrompt)) return 'auth-required';
        return page.url().includes('/favorites/local')
          ? 'local-favorites'
          : 'pending';
      },
      {
        timeout: SEARCH_NAV_TIMEOUT_MS,
        message:
          'Expected anonymous favorites navigation to local favorites page.',
      },
    )
    .not.toBe('pending');

  if (await isVisible(authPrompt)) {
    throw new Error(
      'Anonymous favorites navigation was blocked by the "Sign in required" dialog.',
    );
  }

  await expectPageUrl(page, (url) => url.pathname.includes('/favorites/local'));
  await expect(page.getByTestId('back-to-home')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/**
 * Favorites list-detail URL id. The list id comes from the Norse API; observed
 * as a dash-delimited hex string. Kept permissive (`{24,36}`) to tolerate both
 * the short form seen in some environments and full 36-char UUIDs — tighten
 * once the canonical format is confirmed against a live run. See e2e/AGENTS.md.
 */
const FAVORITES_LIST_URL_RE = /favorites\/[a-f0-9-]{24,36}/;

/**
 * Wait until the browser is on a favorites list-detail page and its content
 * is rendered. Single source of truth for the list-page contract (previously
 * split across two near-identical helpers).
 *
 * `back-to-favorites` (`favorites-section.tsx`) is owner-only chrome — it's
 * only rendered when `favoriteList.viewingAsOwner` is true, which is never
 * the case for an anonymous visitor following a public list's share link.
 * Pass `{ asOwner: false }` for that scenario so the wait targets
 * `favorites-section` (always rendered, regardless of viewer) instead of
 * `back-to-favorites` (would time out forever for a non-owner).
 */
export async function waitForFavoriteListPage(
  page: Page,
  { asOwner = true }: { asOwner?: boolean } = {},
) {
  await expectPageUrl(page, FAVORITES_LIST_URL_RE);
  await page
    .getByTestId(asOwner ? 'back-to-favorites' : 'favorites-section')
    .waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
}

/**
 * The favorites detail page is server-rendered and can briefly lag behind a
 * just-completed add/remove mutation. Reload until the requested favorite is
 * actually rendered on the page.
 */
export async function waitForFavoriteOnListPage(
  page: Page,
  resourceName: string,
) {
  await expect
    .poll(
      async () => {
        const emptyStateVisible = await page
          .getByText(/nothing here yet/i)
          .isVisible()
          .catch(() => false);
        const resourceVisible = await page
          .getByText(resourceName)
          .first()
          .isVisible()
          .catch(() => false);

        if (!resourceVisible) {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await waitForFavoriteListPage(page);
        }

        return {
          emptyStateVisible,
          resourceVisible,
        };
      },
      {
        timeout: FAVORITES_PERSISTENCE_TIMEOUT_MS,
        intervals: [250, 500, 1_000, 2_000],
      },
    )
    .toEqual({
      emptyStateVisible: false,
      resourceVisible: true,
    });
}

/**
 * The inverse of `waitForFavoriteOnListPage`: after a remove mutation, reload
 * the server-rendered list page until the favorite is no longer present.
 */
export async function waitForFavoriteToBeAbsentOnListPage(
  page: Page,
  resourceName: string,
) {
  await expect
    .poll(
      async () => {
        const matches = await page.getByText(resourceName).count();
        if (matches > 0) {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await waitForFavoriteListPage(page);
        }
        return matches;
      },
      {
        timeout: FAVORITES_PERSISTENCE_TIMEOUT_MS,
        intervals: [250, 500, 1_000, 2_000],
      },
    )
    .toBe(0);
}

function favoriteListCardByExactName(page: Page, listName: string) {
  return page.getByTestId('favorite-list-card').filter({
    has: page.getByRole('link', { name: listName, exact: true }),
  });
}

export async function deleteFavoriteList(
  page: Page,
  listName: string,
): Promise<void> {
  const card = favoriteListCardByExactName(page, listName);
  await expect(card).toHaveCount(1, { timeout: UI_SHELL_TIMEOUT_MS });

  const deleteListBtn = card.getByTestId('delete-list-btn');
  await deleteListBtn.waitFor({
    state: 'visible',
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await deleteListBtn.click();

  const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
  await deleteListConfirmBtn.waitFor({
    state: 'visible',
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await deleteListConfirmBtn.click();
}

export async function editFavoriteList(
  page: Page,
  currentListName: string,
  { name, description }: { name: string; description: string },
): Promise<void> {
  const card = favoriteListCardByExactName(page, currentListName);
  await expect(card).toHaveCount(1, { timeout: UI_SHELL_TIMEOUT_MS });

  const editListBtn = card.getByTestId('edit-list-btn');
  await editListBtn.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
  await editListBtn.click();

  const nameInput = page.locator('#name');
  await expect(nameInput).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await nameInput.fill(name);

  const descInput = page.locator('#description');
  await descInput.fill(description);

  const updateListSubmitBtn = page.getByTestId('update-list-submit-btn');
  await expect(updateListSubmitBtn).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await updateListSubmitBtn.click();
}

export async function waitForFavoritesDialogReady(page: Page) {
  await expect(page.getByTestId('favorites-loading-skeleton')).not.toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
  await expect(page.getByTestId('favorites-list-loaded')).toBeAttached({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
  await expect(page.getByTestId('favorites-search-input')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

export async function filterFavoritesDialogLists(page: Page, listName: string) {
  const searchBar = page.getByTestId('favorites-search-input');
  await expect(searchBar).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await searchBar.fill(listName);
  await expect(page.getByTestId('favorites-loading-skeleton')).not.toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
  await expectVisibleEventually(page.getByText(listName).first(), {
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

export async function getFavoritesDialogListActionButton(
  page: Page,
  listName: string,
  testId: 'add-to-list-btn' | 'remove-from-list-btn',
) {
  const dialog = page.getByRole('dialog', { name: /manage favorites/i });
  const listLink = dialog.getByRole('link', { name: listName, exact: true });
  await expect(listLink).toBeVisible({ timeout: ASYNC_UI_TIMEOUT_MS });

  const button = listLink.locator(
    `xpath=following-sibling::div[2]//*[@data-testid="${testId}"]`,
  );
  await expect(button).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  return button;
}

export async function closeFavoritesDialog(page: Page) {
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(
    page.getByRole('dialog', { name: /manage favorites/i }),
  ).toHaveCount(0, { timeout: ASYNC_UI_TIMEOUT_MS });
}

/**
 * Opens the favorites dialog from the page's first `favorite-btn` (search
 * result card or resource-detail page — same testid either way) and filters
 * it to `listName`. Shared setup for the add/remove-via-dialog flows below.
 */
export async function openFavoritesDialogForList(page: Page, listName: string) {
  const favoriteBtn = page.getByTestId('favorite-btn').first();
  await expect(favoriteBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await favoriteBtn.click();

  await waitForFavoritesDialogReady(page);
  await filterFavoritesDialogLists(page, listName);
}

/**
 * Opens the favorites dialog on the first result, adds it to `listName`, and
 * asserts the "Added to list" confirmation. Leaves the dialog open.
 */
export async function addFirstResultToList(page: Page, listName: string) {
  await openFavoritesDialogForList(page, listName);

  const addBtn = await getFavoritesDialogListActionButton(
    page,
    listName,
    'add-to-list-btn',
  );
  await addBtn.click();

  await expect(page.getByText('Added to list')).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/**
 * Removes the current dialog's item from `listName` via the "Remove from
 * list" action and asserts the "Removed from list" confirmation. Assumes the
 * favorites dialog is already open and filtered to `listName`.
 */
export async function removeFromListViaDialog(page: Page, listName: string) {
  const removeBtn = await getFavoritesDialogListActionButton(
    page,
    listName,
    'remove-from-list-btn',
  );
  await removeBtn.click();

  await expect(page.getByText('Removed from list')).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/**
 * On a favorites list-detail page (not the dialog), removes the first listed
 * resource via its inline remove button + confirm, and asserts the "Removed
 * from list" confirmation.
 */
export async function removeFirstResourceFromListPage(page: Page) {
  const removeTrigger = page.getByTestId('remove-from-list-btn').first();
  await expect(removeTrigger).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await removeTrigger.click();

  const removeConfirmBtn = page.getByTestId(
    'remove-from-current-list-confirm-btn',
  );
  await expect(removeConfirmBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await removeConfirmBtn.click();

  await expect(page.getByText('Removed from list')).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}
