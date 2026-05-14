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
  waitForPageStabilized,
} from './helpers';
import { UI_SHELL_TIMEOUT_MS } from './timeouts';

test.describe('Language Persistence And Results Button', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('same selected filters and result count persist across EN <-> ES', async ({
    page,
  }) => {
    await openTopicSearch(page);
    await applyTestLocationOnSearchPage(page);

    // Wait for page to fully stabilize after location application
    await waitForPageStabilized(page);

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
    await waitForPageStabilized(page);

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
    await waitForPageStabilized(page);

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
    await waitForPageStabilized(page);

    const r2BackInEnglish = await getResultTotalNumber(page);
    expect(r2BackInEnglish).toBe(r2);

    const selectedBackInEnglish = await getSelectedFilterIds(page);
    expect(selectedBackInEnglish).toEqual(selectedInEnglish);

    const resultTotalTextEnAgain = await getResultTotalText(page);
    expect(resultTotalTextEnAgain.toLowerCase()).toContain('of');

    const r2TitlesEnglishAgain = await getResultTitles(page);
    expect(r2TitlesEnglishAgain.length).toBeGreaterThan(0);
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
