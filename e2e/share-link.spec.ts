import {
  closeShareDialog,
  expect,
  expectPageUrl,
  goHome,
  isSearchResourceDetailUrl,
  isSearchResultsListUrl,
  openShareDialogAndGetShortUrl,
  openShortUrlInNewPage,
  performSearch,
  searchAndGetFirstResult,
  test,
} from './helpers';
import { UI_SHELL_TIMEOUT_MS } from './timeouts';

// Covers the `/share/[shortCode]` link-shortening + redirect flow (see
// src/app/(app)/[locale]/share/[shortCode]/page.tsx) from the two entry
// points that are reachable without authentication: the search results page
// and a resource detail page. The public-favorite-list share flow requires
// an authenticated session to create the list, so it lives in
// favorites.spec.ts instead (see the "public favorite list" test there).
test.describe('Share Link Feature (Anonymous)', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('sharing the search results page produces a link that leads back to the same search', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    const shortUrl = await openShareDialogAndGetShortUrl(page);
    await closeShareDialog(page);

    const sharedPage = await openShortUrlInNewPage(page.context(), shortUrl);
    try {
      await expectPageUrl(sharedPage, isSearchResultsListUrl);
      expect(sharedPage.url()).toContain('query=food');
      await expect(sharedPage.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    } finally {
      await sharedPage.close();
    }
  });

  test('sharing a resource detail page produces a link that leads back to that resource', async ({
    page,
  }) => {
    const { link } = await searchAndGetFirstResult(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });
    await link.click();
    await expectPageUrl(page, isSearchResourceDetailUrl);
    await expect(page.getByTestId('favorite-btn').first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    const originalPathname = new URL(page.url()).pathname;

    const shortUrl = await openShareDialogAndGetShortUrl(page);
    await closeShareDialog(page);

    const sharedPage = await openShortUrlInNewPage(page.context(), shortUrl);
    try {
      await expectPageUrl(sharedPage, isSearchResourceDetailUrl);
      expect(new URL(sharedPage.url()).pathname).toBe(originalPathname);
      await expect(sharedPage.getByTestId('favorite-btn').first()).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    } finally {
      await sharedPage.close();
    }
  });
});
