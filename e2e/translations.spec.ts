import {
  applyTestLocationOnSearchPage,
  expect,
  expectPageUrl,
  getResultTitles,
  getResultTotalNumber,
  getResultTotalText,
  getSelectedFilterIds,
  goHome,
  isSearchResourceDetailUrl,
  isSearchResultsListUrl,
  markFirstNEnabledFilters,
  openTopicSearch,
  performSearch,
  switchLanguage,
  test,
  waitForSearchResultsSettled,
} from './helpers';
import {
  getCurrentTenant,
  hasFacetsForCurrentTenant,
} from './fixtures/tenants';
import { UI_SHELL_TIMEOUT_MS } from './timeouts';

test.describe('Language Persistence And Results Button', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('same selected filters and result count persist across EN <-> ES', async ({
    page,
  }) => {
    test.skip(
      !hasFacetsForCurrentTenant(),
      'This tenant/environment has no search facets/filters (see e2e/fixtures/tenants.ts)',
    );

    const { taxonomy } = getCurrentTenant();
    await performSearch(page, {
      query: taxonomy.code,
      query_label: taxonomy.label,
      query_type: 'taxonomy',
    });
    await applyTestLocationOnSearchPage(page, getCurrentTenant().testLocation);

    // Wait for page to fully stabilize after location application
    await waitForSearchResultsSettled(page);

    const availableFilters = await page
      .locator('#filter-panel [role="checkbox"]')
      .count();
    test.skip(
      availableFilters < 2,
      'No sufficient topic facet checkboxes available on this environment.',
    );

    const r0 = await getResultTotalNumber(page);
    expect(r0).toBeGreaterThan(0);

    await markFirstNEnabledFilters(page, 3);

    // Wait for results to update after filter changes
    await waitForSearchResultsSettled(page);

    const r2 = await getResultTotalNumber(page);
    expect(r2).toBeLessThanOrEqual(r0);

    const r2TitlesEnglish = await getResultTitles(page);
    expect(r2TitlesEnglish.length).toBeGreaterThan(0);

    const selectedInEnglish = await getSelectedFilterIds(page);
    test.skip(
      selectedInEnglish.length < 2,
      'Need at least two selected filters for persistence checks in this environment.',
    );
    const resultTotalTextEn = await getResultTotalText(page);
    expect(resultTotalTextEn.toLowerCase()).toContain('of');

    await switchLanguage(page, 'es');

    // Wait for language switch and results to stabilize
    await waitForSearchResultsSettled(page);

    const r2InSpanish = await getResultTotalNumber(page);
    expect(r2InSpanish).toBe(r2);

    const selectedInSpanish = await getSelectedFilterIds(page);
    expect(selectedInSpanish).toEqual(selectedInEnglish);

    const resultTotalTextEs = await getResultTotalText(page);
    expect(resultTotalTextEs.toLowerCase()).toContain('de');

    const r2TitlesSpanish = await getResultTitles(page);
    expect(r2TitlesSpanish.length).toBeGreaterThan(0);

    await switchLanguage(page, 'en');

    // Wait for language switch back to English and results to stabilize
    await waitForSearchResultsSettled(page);

    const r2BackInEnglish = await getResultTotalNumber(page);
    expect(r2BackInEnglish).toBe(r2);

    const selectedBackInEnglish = await getSelectedFilterIds(page);
    expect(selectedBackInEnglish).toEqual(selectedInEnglish);

    const resultTotalTextEnAgain = await getResultTotalText(page);
    expect(resultTotalTextEnAgain.toLowerCase()).toContain('of');

    const r2TitlesEnglishAgain = await getResultTitles(page);
    expect(r2TitlesEnglishAgain.length).toBeGreaterThan(0);
  });

  // Regression: switching ES -> EN on a search page, then clicking a filter,
  // landed back on `/es/search`. An unprefixed path takes its language from the
  // NEXT_LOCALE cookie, and the proxy let background requests write it: while
  // the switch was in flight the still-mounted Spanish page prefetched its
  // `/es…` links, which reset the cookie to `es`, so the filter's `/search?…`
  // push was redirected to Spanish.
  test('clicking a filter after switching EN -> ES -> EN stays in English', async ({
    page,
    context,
  }) => {
    test.skip(
      !hasFacetsForCurrentTenant(),
      'This tenant/environment has no search facets/filters (see e2e/fixtures/tenants.ts)',
    );

    // Search on the host under test. (Home-page topic links can be absolute
    // CMS hrefs to another host, e.g. production, so they are not followed.)
    const origin = new URL(page.url()).origin;
    const { taxonomy } = getCurrentTenant();
    await performSearch(page, {
      query: taxonomy.code,
      query_label: taxonomy.label,
      query_type: 'taxonomy',
    });
    await waitForSearchResultsSettled(page);
    expect(new URL(page.url()).origin).toBe(origin);

    await switchLanguage(page, 'es');
    await waitForSearchResultsSettled(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await switchLanguage(page, 'en');
    await waitForSearchResultsSettled(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const availableFilters = await page
      .locator('#filter-panel [role="checkbox"]')
      .count();
    test.skip(
      availableFilters === 0,
      'No facet checkboxes on this topic search in this environment.',
    );

    const searchBeforeFilter = new URL(page.url()).search;
    await markFirstNEnabledFilters(page, 1);
    // The filter is applied once the URL's query changes; the path it lands on
    // (with or without `/es`) is final at that point.
    await expectPageUrl(
      page,
      (url) => isSearchResultsListUrl(url) && url.search !== searchBeforeFilter,
    );
    await waitForSearchResultsSettled(page);

    expect(countLocaleSegments(new URL(page.url()), 'es')).toBe(0);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect((await getResultTotalText(page)).toLowerCase()).toContain('of');

    const localeCookie = (await context.cookies()).find(
      (cookie) => cookie.name === 'NEXT_LOCALE',
    );
    expect(localeCookie?.value).toBe('en');
  });

  test('resource page back button is Results and returns to list EN', async ({
    page,
  }) => {
    await openTopicSearch(page);

    const firstResult = page
      .locator('#search-container')
      .getByTestId('resource-link')
      .first();
    await expect(firstResult).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    // Resource detail path is /search/{uuid} (not /search? which is the list). Race
    // the URL wait with the click so the client navigation is not missed.
    await Promise.all([
      expectPageUrl(page, isSearchResourceDetailUrl),
      firstResult.click(),
    ]);

    const resultsButton = page.getByRole('link', { name: /^Results$/i });
    await expect(resultsButton).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await resultsButton.click();
    await expectPageUrl(page, isSearchResultsListUrl);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('resource page back button is Results and returns to list ES', async ({
    page,
  }) => {
    await switchLanguage(page, 'es');

    await performSearch(page, {
      query: 'comida',
      query_label: 'comida',
      query_type: 'text',
    });

    const firstResult = page
      .locator('#search-container')
      .getByTestId('resource-link')
      .first();
    await expect(firstResult).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    await Promise.all([
      expectPageUrl(page, isSearchResourceDetailUrl),
      firstResult.click(),
    ]);

    const resultsButton = page.getByRole('link', { name: /^Resultados$/i });
    await expect(resultsButton).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await resultsButton.click();
    await expectPageUrl(page, isSearchResultsListUrl);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });
});

/** Number of path segments equal to `locale` (base-path agnostic). */
function countLocaleSegments(url: URL, locale: string): number {
  return url.pathname.split('/').filter((segment) => segment === locale).length;
}

test.describe('Localized Search Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  // Regression: pagination hrefs were built from `usePathname()` (already
  // locale-prefixed) and then prefixed again by `LocalizedLink`, producing
  // `/es/es/search?...&page=2`.
  test('pagination links keep a single locale segment in ES', async ({
    page,
  }) => {
    const { broadQuery } = getCurrentTenant();

    await switchLanguage(page, 'es');
    await performSearch(page, {
      query: broadQuery,
      query_label: broadQuery,
      query_type: 'text',
    });
    await waitForSearchResultsSettled(page);

    const total = await getResultTotalNumber(page);
    test.skip(total <= 10, `Expected >10 results for pagination, got ${total}`);

    expect(countLocaleSegments(new URL(page.url()), 'es')).toBe(1);

    const pagination = page.getByTestId('pagination');
    await expect(pagination).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    const hrefs = await pagination
      .locator('a[href]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).href),
      );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const url = new URL(href);
      expect(isSearchResultsListUrl(url), href).toBe(true);
      expect(countLocaleSegments(url, 'es'), href).toBe(1);
    }

    await Promise.all([
      expectPageUrl(
        page,
        (url) =>
          url.searchParams.get('page') === '2' &&
          isSearchResultsListUrl(url) &&
          countLocaleSegments(url, 'es') === 1,
      ),
      page.getByTestId('pagination-next').click(),
    ]);
    await waitForSearchResultsSettled(page);

    expect(await getResultTotalNumber(page)).toBe(total);
  });
});
