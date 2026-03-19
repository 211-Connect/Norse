import {
  test,
  expect,
  goHome,
  getResultTotalNumber,
  getResultTotalText,
  getResultTitles,
  openTopicSearch,
  markFiltersByIds,
  getSelectedFilterIds,
  switchLanguage,
  performSearch,
} from './helpers';

test.describe('Language Persistence And Results Button', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('same selected filters and result count persist across EN <-> ES', async ({
    page,
  }) => {
    await openTopicSearch(page);

    const availableFilters = await page
      .locator('#filter-panel [role="checkbox"]')
      .count();
    test.skip(
      availableFilters < 2,
      'No sufficient topic facet checkboxes available on this environment.',
    );

    const r0 = await getResultTotalNumber(page);
    expect(r0).toBeGreaterThan(0);

    const requiredFilterIds = [
      'Low Income',
      'General',
      'Low-Cost/Sliding Scale',
    ];
    await markFiltersByIds(page, requiredFilterIds);

    const r2 = await getResultTotalNumber(page);
    expect(r2).toBeLessThanOrEqual(r0);

    const r2TitlesEnglish = await getResultTitles(page);
    expect(r2TitlesEnglish.length).toBeGreaterThan(0);

    const selectedInEnglish = await getSelectedFilterIds(page);
    expect(selectedInEnglish).toEqual(
      expect.arrayContaining(requiredFilterIds),
    );
    const resultTotalTextEn = await getResultTotalText(page);
    expect(resultTotalTextEn.toLowerCase()).toContain('of');

    await switchLanguage(page, 'es');

    const r2InSpanish = await getResultTotalNumber(page);
    expect(r2InSpanish).toBe(r2);

    const selectedInSpanish = await getSelectedFilterIds(page);
    expect(selectedInSpanish).toEqual(selectedInEnglish);

    const resultTotalTextEs = await getResultTotalText(page);
    expect(resultTotalTextEs.toLowerCase()).toContain('de');

    const r2TitlesSpanish = await getResultTitles(page);
    expect(r2TitlesSpanish.length).toBeGreaterThan(0);

    await switchLanguage(page, 'en');

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

    const firstResult = page.getByTestId('resource-link').first();
    await expect(firstResult).toBeVisible({ timeout: 20_000 });
    await firstResult.click();

    await page.waitForURL(/\/search\//, { timeout: 20_000 });

    const resultsButton = page.getByRole('button', { name: /^Results$/i });
    await expect(resultsButton).toBeVisible({ timeout: 20_000 });
    await resultsButton.click();

    await page.waitForURL(/\/search\?/);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('resource page back button is Results and returns to list ES', async ({
    page,
  }) => {
    await switchLanguage(page, 'es');

    await performSearch(page, {
      query: 'Necesito comida',
      query_label: 'Necesito comida',
      query_type: 'text',
    });

    const firstResult = page.getByTestId('resource-link').first();
    await expect(firstResult).toBeVisible({ timeout: 20_000 });
    await firstResult.click();

    await page.waitForURL(/\/search\//, { timeout: 20_000 });

    const resultsButton = page.getByRole('button', { name: /^Resultados$/i });
    await expect(resultsButton).toBeVisible({ timeout: 20_000 });
    await resultsButton.click();

    await page.waitForURL(/\/search\?/);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: 20_000,
    });
  });
});
