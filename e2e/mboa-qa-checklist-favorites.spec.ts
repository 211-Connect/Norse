/**
 * Authenticated part of the MBOA weekly manual QA checklist
 * ("Connect211-QA Checklist.xlsx", sheet `11102026`): the Favorites
 * scenarios that need a signed-in user. Anonymous scenarios are in
 * `mboa-qa-checklist.spec.ts`.
 *
 * Same session pattern as `favorites.spec.ts` (see e2e/AGENTS.md
 * "Authenticated favorites: log in once"): `beforeAll` logs in once and saves
 * the session; tests reuse it via `test.use({ storageState })`. The one
 * exception is "Anonymous User Lists", which *is* the anonymous → signed-in
 * transition (local favorites are synced into "My New List" on sign-in), so it
 * runs in its own fresh context and signs in itself.
 *
 * Every list this file creates is tagged with a per-run id and deleted by the
 * test that owns it; `afterAll` sweeps leftovers from a failed run with a
 * fresh login (the last test signs the shared session out).
 */
import { type Page } from '@playwright/test';

import { AUTH_STORAGE_STATE_PATH, hasTestCredentials } from './env';
import { MBOA_GUIDED_TOPICS } from './fixtures/mboa-qa-checklist';
import { getCurrentTenantKey } from './fixtures/tenants';
import {
  clickHeaderHome,
  deleteFavoriteList,
  expect,
  expectAuthenticatedShell,
  expectKeycloakSignInForm,
  expectLocalFavorites,
  expectOnHomePage,
  expectPageUrl,
  expectSearchBarText,
  favoriteListCardByExactName,
  favoriteTopResultsLocally,
  filterFavoriteListsByName,
  filterFavoritesDialogLists,
  getFavoritesDialogListActionButton,
  goHome,
  goToFavorites,
  goToLocalFavorites,
  isSearchResourceDetailUrl,
  loginViaKeycloak,
  openFavoriteListByName,
  openGuidedSearchTopic,
  resetLocalFavoritesStorage,
  submitKeycloakCredentials,
  test,
  toSingleRegexLiteral,
  waitForFavoriteListPage,
  waitForFavoriteOnListPage,
  waitForFavoriteToBeAbsentOnListPage,
  waitForFavoritesDialogReady,
} from './helpers';
import {
  ASYNC_UI_TIMEOUT_MS,
  FAVORITES_PERSISTENCE_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

/**
 * Name the API gives the list it creates from synced local favorites
 * (Norse-API `FavoriteListService`, hard-coded `'My New List'`). The QA sheet
 * spells it "My new list", but list cards are matched by exact,
 * case-sensitive link name, so this must match the API.
 */
const SYNCED_LIST_NAME = 'My New List';

/**
 * Budget for sweeping every leftover list with one name. Each deletion costs
 * a confirm dialog plus a reload, and sync leftovers pile up (one per signed-in
 * run whose cleanup failed), so one persistence window is not enough.
 */
const LEFTOVER_SWEEP_TIMEOUT_MS = FAVORITES_PERSISTENCE_TIMEOUT_MS * 3;

const hasAuth = hasTestCredentials;

test.describe('MBOA QA checklist (authenticated favorites)', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(
    getCurrentTenantKey() !== 'MBOA',
    'MBOA QA checklist — data is specific to the MN Aging & Disability Resources tenant',
  );
  test.skip(
    !hasAuth,
    'Skipped — no test credentials (set TEST_USER_PASSWORD; TEST_USER_EMAIL is derived from fixtures when E2E_TENANT_KEY/E2E_TENANT_ENV are set)',
  );

  test.use({
    storageState: hasAuth ? AUTH_STORAGE_STATE_PATH : undefined,
  });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const syncedListRenamed = `QA Checklist Synced ${runId}`;
  const headerLinksList = `QA Checklist List A ${runId}`;
  const detailsPageList = `QA Checklist List B ${runId}`;
  const ownedLists = [syncedListRenamed, headerLinksList, detailsPageList];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await loginViaKeycloak(page);
      await expectAuthenticatedShell(page);
      await context.storageState({ path: AUTH_STORAGE_STATE_PATH });

      // Step 13 expects exactly one "My New List" card, so drop leftovers
      // from earlier runs (or manual QA on this account) first. Note the
      // sync's "created" result (and toast) depends on whether a list with
      // the same set of favorites already exists, not on the name.
      await goToFavorites(page);
      await deleteAllListsNamed(page, SYNCED_LIST_NAME);
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    // The last test signs the shared session out, so sweep with a new login.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await loginViaKeycloak(page);
      await goToFavorites(page);
      for (const listName of [...ownedLists, SYNCED_LIST_NAME]) {
        await deleteAllListsNamed(page, listName);
      }
    } finally {
      await context.close();
    }
  });

  // Checklist steps 11-16 (steps 1-10 are anonymous-only and live in
  // `mboa-qa-checklist.spec.ts`).
  test('Anonymous User Lists — sign in keeps local favorites', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await goHome(page);
      await resetLocalFavoritesStorage(page);

      const savedNames =
        await test.step('11. "Emergency shelter" → favorite top 3 → Favorites', async () => {
          await openGuidedSearchTopic(
            page,
            MBOA_GUIDED_TOPICS.emergencyShelter,
          );
          const names = await favoriteTopResultsLocally(page, 3);
          await goToLocalFavorites(page);
          await expectLocalFavorites(page, names);
          return names;
        });

      await test.step('12. Header "Login" → sign-in page', async () => {
        await page.getByTestId('header-sign-in-btn').click();
        await expectKeycloakSignInForm(page);
      });

      await test.step('13. Sign in → "List created" toast, "My New List" on Favorites', async () => {
        await submitKeycloakCredentials(page);
        await expect(page.getByText('List created')).toBeVisible({
          timeout: FAVORITES_PERSISTENCE_TIMEOUT_MS,
        });
        await goToFavorites(page);
        await filterFavoriteListsByName(page, SYNCED_LIST_NAME);
        await expect(
          favoriteListCardByExactName(page, SYNCED_LIST_NAME),
        ).toHaveCount(1);
      });

      await test.step('14. Open "My New List" → the 3 favorites from step 11', async () => {
        await openFavoriteListByName(page, SYNCED_LIST_NAME);
        await waitForFavoriteListPage(page);
        for (const name of savedNames) {
          await waitForFavoriteOnListPage(page, name);
        }
      });

      await test.step('15. Pencil icon → "Update list" dialog', async () => {
        await page.getByTestId('edit-list-btn').click();
        await expect(page.locator('#name')).toBeVisible({
          timeout: UI_SHELL_TIMEOUT_MS,
        });
      });

      await test.step('16. New name + description → Update', async () => {
        const description = `Renamed by the QA checklist e2e (${runId})`;
        await page.locator('#name').fill(syncedListRenamed);
        await page.locator('#description').fill(description);
        await page.getByTestId('update-list-submit-btn').click();

        await expect(page.getByText(syncedListRenamed).first()).toBeVisible({
          timeout: ASYNC_UI_TIMEOUT_MS,
        });
        await expect(page.getByText(description).first()).toBeVisible();
      });

      await goToFavorites(page);
      await deleteFavoriteList(page, syncedListRenamed);
    } finally {
      await context.close();
    }
  });

  test('Favorites & Homepage Header Links', async ({ page }) => {
    await goHome(page);

    await test.step('1. Favorites → "+ Create a list"', async () => {
      await goToFavorites(page);
      await page.getByTestId('create-list-btn').click();
      await expect(page.locator('#name')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    await test.step('2. Name + description → Create', () =>
      createListInOpenDialog(page, headerLinksList));

    await test.step('2b. The new list is on the Favorites page', async () => {
      await filterFavoriteListsByName(page, headerLinksList);
    });

    await test.step('3. Header "Home"', () => clickHeaderHome(page));

    await test.step('4. "Public transportation" guided search', async () => {
      await openGuidedSearchTopic(
        page,
        MBOA_GUIDED_TOPICS.publicTransportation,
      );
      await expectSearchBarText(
        page,
        MBOA_GUIDED_TOPICS.publicTransportation.name,
      );
    });

    const firstSaved =
      await test.step('5. Heart on a result → favorites lists pop-up', async () => {
        const name = await resultNameAt(page, 0);
        await page.getByTestId('favorite-btn').nth(0).click();
        await waitForFavoritesDialogReady(page);
        return name;
      });

    await test.step('6. Heart next to the list from step 1 → "Added to list"', () =>
      addToListInOpenDialog(page, headerLinksList));

    await test.step('7. Close the pop-up → results again', async () => {
      await closeManageFavoritesDialog(page);
      await expect(page.getByTestId('resource-link').first()).toBeVisible();
    });

    const detailsSaved =
      await test.step('8. Open a different result → details page', async () => {
        const name = await resultNameAt(page, 1);
        await page.getByTestId('resource-link').nth(1).click();
        await expectPageUrl(page, isSearchResourceDetailUrl);
        return name;
      });

    await test.step('9. "Favorite" on the details page → favorites lists pop-up', async () => {
      await page.getByTestId('favorite-btn').first().click();
      await waitForFavoritesDialogReady(page);
    });

    await test.step('10. "+ Create a list" in the pop-up', async () => {
      await manageFavoritesDialog(page)
        .getByRole('button', { name: /create a list/i })
        .click();
      await expect(page.locator('#name')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    await test.step('11. Name + description → Create → list shows in the pop-up', async () => {
      await createListInOpenDialog(page, detailsPageList);
      await waitForFavoritesDialogReady(page);
      await filterFavoritesDialogLists(page, detailsPageList);
    });

    await test.step('12. Heart next to the new list → "Added to list"', () =>
      addToListInOpenDialog(page, detailsPageList));

    await test.step('13. Close the pop-up → details page again', async () => {
      await closeManageFavoritesDialog(page);
      await expectPageUrl(page, isSearchResourceDetailUrl);
    });

    const moreSaved =
      await test.step('14. Add 3 more results to this list', async () => {
        await page.goBack();
        await expect(page.getByTestId('resource-link').first()).toBeVisible({
          timeout: UI_SHELL_TIMEOUT_MS,
        });
        const names: string[] = [];
        for (const index of [2, 3, 4]) {
          names.push(await resultNameAt(page, index));
          await page.getByTestId('favorite-btn').nth(index).click();
          await waitForFavoritesDialogReady(page);
          await filterFavoritesDialogLists(page, detailsPageList);
          await addToListInOpenDialog(page, detailsPageList);
          await closeManageFavoritesDialog(page);
        }
        return names;
      });

    await test.step('15. Header "Favorites"', () => goToFavorites(page));

    await test.step('16. "View list" on the step-1 list → the step-5 favorite', async () => {
      await filterFavoriteListsByName(page, headerLinksList);
      await favoriteListCardByExactName(page, headerLinksList)
        .getByRole('link', { name: 'View list' })
        .click();
      await waitForFavoriteListPage(page);
      await waitForFavoriteOnListPage(page, firstSaved);
    });

    await test.step('17. "Back to favorites"', async () => {
      await page.getByTestId('back-to-favorites').click();
      await expectPageUrl(page, (u) => /\/favorites\/?$/.test(u.pathname));
      await expect(page.getByTestId('create-list-btn')).toBeVisible();
    });

    await test.step("18. Click the step-10 list's name → its 4 favorites", async () => {
      await openFavoriteListByName(page, detailsPageList);
      await waitForFavoriteListPage(page);
      for (const name of [detailsSaved, ...moreSaved]) {
        await waitForFavoriteOnListPage(page, name);
      }
    });

    await test.step('19. "See more" → details page', async () => {
      await page
        .getByRole('link', { name: `See more: ${detailsSaved}` })
        .first()
        .click();
      await expectPageUrl(page, isSearchResourceDetailUrl);
    });

    await test.step('20. Browser back → the list again', async () => {
      await page.goBack();
      await waitForFavoriteListPage(page);
      await waitForFavoriteOnListPage(page, detailsSaved);
    });
  });

  test('Delete & Log Out', async ({ page }) => {
    await goHome(page);
    await goToFavorites(page);

    const removed = await test.step('1. Open a list', async () => {
      await openFavoriteListByName(page, detailsPageList);
      await waitForFavoriteListPage(page);
      const first = page.getByTestId('remove-from-list-btn').first();
      await expect(first).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
      return ((await first.getAttribute('aria-label')) ?? '')
        .replace(/^Remove from list\s*/i, '')
        .trim();
    });

    await test.step('2. Slashed heart → "Remove from list?"', async () => {
      await page.getByTestId('remove-from-list-btn').first().click();
      await expect(page.getByRole('dialog')).toContainText(
        /remove from list\?/i,
      );
    });

    await test.step('3. Remove → resource gone from the list', async () => {
      await page.getByTestId('remove-from-current-list-confirm-btn').click();
      await expect(page.getByText('Removed from list')).toBeVisible({
        timeout: ASYNC_UI_TIMEOUT_MS,
      });
      if (removed) {
        await waitForFavoriteToBeAbsentOnListPage(page, removed);
      }
    });

    await test.step('4. "Back to favorites"', async () => {
      await page.getByTestId('back-to-favorites').click();
      await expect(page.getByTestId('create-list-btn')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    await test.step('5. Trash can on the step-6 list → "Delete …?"', async () => {
      await filterFavoriteListsByName(page, headerLinksList);
      await favoriteListCardByExactName(page, headerLinksList)
        .getByTestId('delete-list-btn')
        .click();
      await expect(page.getByRole('dialog')).toContainText(
        new RegExp(`Delete.*${toSingleRegexLiteral(headerLinksList)}`),
      );
    });

    await test.step('6. Delete → the list is gone', async () => {
      await page.getByTestId('delete-list-confirm-btn').click();
      await expect(
        favoriteListCardByExactName(page, headerLinksList),
      ).toHaveCount(0, { timeout: FAVORITES_PERSISTENCE_TIMEOUT_MS });
    });

    // Not a checklist step: delete the other list this run created while the
    // session is still signed in.
    await deleteFavoriteList(page, detailsPageList);

    await test.step('7. "Log out" → home page', async () => {
      await page
        .locator('#app-header')
        .getByRole('button', { name: /log out/i })
        .click();
      await expectOnHomePage(page);
      await expect(page.getByTestId('header-sign-in-btn')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    // The checklist expects a "Sign in required" dialog here. The app now
    // sends "Login" straight to the sign-in page (`/auth/signin` → Keycloak),
    // so assert the signed-out outcome instead: credentials are asked for
    // again rather than silently reusing the old session.
    await test.step('8. "Login" again → sign-in required', async () => {
      await page.getByTestId('header-sign-in-btn').click();
      await expectKeycloakSignInForm(page);
    });
  });
});

function manageFavoritesDialog(page: Page) {
  return page.getByRole('dialog', { name: /manage favorites/i });
}

async function resultNameAt(page: Page, index: number) {
  const link = page.getByTestId('resource-link').nth(index);
  await expect(link).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  return ((await link.textContent()) ?? '').trim();
}

/** Fills the open create-list dialog (`#name`/`#description`) and submits. */
async function createListInOpenDialog(page: Page, listName: string) {
  await page.locator('#name').fill(listName);
  await page
    .locator('#description')
    .fill('Created by the MBOA QA checklist e2e');
  await page.getByTestId('create-list-submit-btn').click();
  await expect(page.getByText('List created')).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/** In the open "Manage favorites" pop-up: heart next to `listName` → "Added to list". */
async function addToListInOpenDialog(page: Page, listName: string) {
  await filterFavoritesDialogLists(page, listName);
  const addButton = await getFavoritesDialogListActionButton(
    page,
    listName,
    'add-to-list-btn',
  );
  await addButton.click();
  await expect(page.getByText('Added to list').first()).toBeVisible({
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/** Closes the "Manage favorites" pop-up with its "x" button. */
async function closeManageFavoritesDialog(page: Page) {
  await manageFavoritesDialog(page)
    .getByRole('button', { name: 'Close' })
    .click();
  await expect(manageFavoritesDialog(page)).toHaveCount(0, {
    timeout: ASYNC_UI_TIMEOUT_MS,
  });
}

/** On /favorites: deletes every list named exactly `listName` (0..n). */
async function deleteAllListsNamed(page: Page, listName: string) {
  const search = page.getByTestId('list-search-input');
  await expect(search).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await search.fill(listName);
  await expectPageUrl(page, (u) => u.searchParams.get('search') === listName);

  await expect
    .poll(
      async () => {
        const cards = favoriteListCardByExactName(page, listName);
        const count = await cards.count();
        if (count > 0) {
          await cards.first().getByTestId('delete-list-btn').click();
          await page.getByTestId('delete-list-confirm-btn').click();
          await expect(page.getByRole('dialog')).toHaveCount(0, {
            timeout: ASYNC_UI_TIMEOUT_MS,
          });
          await page.reload({ waitUntil: 'domcontentloaded' });
          await expect(search).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
        }
        return count;
      },
      {
        timeout: LEFTOVER_SWEEP_TIMEOUT_MS,
        intervals: [500, 1_000, 2_000],
      },
    )
    .toBe(0);
}
