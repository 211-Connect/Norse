import type { Page } from '@playwright/test';

import { getCurrentTenant } from './fixtures/tenants';
import {
  expect,
  expectPageUrl,
  getResultTotal,
  getResultTotalNumber,
  getSelectedFilterIds,
  goHome,
  isSearchResourceDetailUrl,
  markFirstNEnabledFilters,
  openSearchDialog,
  parseTotalFromResultText,
  performSearch,
  searchAndGetFirstResult,
  switchLanguage,
  test,
  waitForFilterPanelInteractive,
} from './helpers';
import {
  AUTOCOMPLETE_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

const BROAD_QUERIES = ['food', 'housing', 'health', 'shelter'];

async function searchWithFallbackQueries(page: Page) {
  let last: { query: string; total: number } = {
    query: BROAD_QUERIES[0],
    total: 0,
  };

  for (const query of BROAD_QUERIES) {
    try {
      await goHome(page);
      await performSearch(page, {
        query,
        query_label: query,
        query_type: 'text',
      });

      const totalText = await getResultTotal(page);
      const total = parseTotalFromResultText(totalText);
      last = { query, total };
      if (total > 10) {
        return { query, total };
      }
    } catch {
      // Staging/local data or navigation can differ; try the next broad query
    }
  }

  return last;
}

test.describe('Search Autocomplete Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('typing a broad query and submitting a topic suggestion returns results', async ({
    page,
  }) => {
    async function trySuggestion(
      query: string,
      index: number,
    ): Promise<number> {
      await goHome(page);
      const searchInput = await openSearchDialog(page);
      await searchInput.fill(query);

      const listbox = page.getByTestId('autocomplete-listbox');
      await listbox.waitFor({
        state: 'visible',
        timeout: AUTOCOMPLETE_TIMEOUT_MS,
      });

      const topicSuggestions = listbox
        .getByTestId('autocomplete-option')
        .filter({ hasNotText: /^i need/i });
      // Suggestions can stream in progressively after the listbox first
      // becomes visible - poll for the count to stop changing (not just
      // become non-zero) so we don't act on a partial render.
      let previousCount = -1;
      await expect
        .poll(
          async () => {
            const current = await topicSuggestions.count();
            const stable = current > 0 && current === previousCount;
            previousCount = current;
            return stable;
          },
          {
            timeout: AUTOCOMPLETE_TIMEOUT_MS,
            intervals: [150, 250, 400],
          },
        )
        .toBe(true);

      const count = await topicSuggestions.count();
      if (index >= count) {
        return 0;
      }

      await topicSuggestions.nth(index).click();

      const submitButton = page.getByTestId('search-submit-btn');
      await expect(submitButton).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });
      await submitButton.click();

      const totalText = await getResultTotal(page);
      return parseTotalFromResultText(totalText);
    }

    const MAX_SUGGESTIONS_TO_TRY = 5;
    let total = 0;
    outer: for (const query of [
      getCurrentTenant().broadQuery,
      ...BROAD_QUERIES,
    ]) {
      for (let i = 0; i < MAX_SUGGESTIONS_TO_TRY; i++) {
        total = await trySuggestion(query, i);
        if (total > 0) {
          break outer;
        }
      }
    }

    expect(total).toBeGreaterThan(0);
  });

  test('should show suggestion options when typing a matching phrase', async ({
    page,
  }) => {
    const searchInput = await openSearchDialog(page);
    await searchInput.fill('I need');

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    const texts = await options.allTextContents();
    const matchingSuggestions = texts.filter((t) =>
      t.toLowerCase().includes('i need'),
    );
    expect(matchingSuggestions.length).toBeGreaterThan(0);
  });

  test('should show taxonomy group when typing a known taxonomy keyword', async ({
    page,
  }) => {
    const searchInput = await openSearchDialog(page);
    await searchInput.fill('food');

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('selecting a suggestion should navigate to search results', async ({
    page,
  }) => {
    await performSearch(page, {
      query: 'I need food',
      query_label: 'I need food',
      query_type: 'text',
    });

    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });
});

test.describe('Taxonomy Search Result Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });
  test('searching for a taxonomy subcategory should return results', async ({
    page,
  }) => {
    const { taxonomy } = getCurrentTenant();

    await performSearch(page, {
      query: taxonomy.code,
      query_label: taxonomy.label,
      query_type: 'taxonomy',
    });

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
  });
});

test.describe('Search result navigation feedback', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  // Regression coverage for the resource-title top-loader bug: clicking a
  // result's title used to render `target="_self"` on the link, which makes
  // nextjs-toploader's click handler treat it like a target="_blank"/external
  // link and finish the progress bar synchronously (before any navigation
  // feedback is visible), instead of keeping it up until the resource page
  // actually renders. See `typography.tsx`'s `isNextLink` branch.
  test('top loader stays visible from resource title click until the resource page renders', async ({
    page,
  }) => {
    const { link } = await searchAndGetFirstResult(page, {
      query: 'shelter',
      query_label: 'shelter',
      query_type: 'text',
    });

    const toploaderBar = page.getByTestId('toploader-bar');

    await link.click();

    // Must appear right away and stay up while the resource page's server
    // work (arcjet check, resource fetch, i18n init) is still in flight.
    await expect(toploaderBar).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    await expectPageUrl(page, isSearchResourceDetailUrl, {
      timeout: SEARCH_NAV_TIMEOUT_MS,
    });
    await expect(page.getByTestId('favorite-btn').first()).toBeVisible({
      timeout: SEARCH_NAV_TIMEOUT_MS,
    });

    // Only once the resource page has actually rendered should it disappear.
    await expect(toploaderBar).toBeHidden({ timeout: UI_SHELL_TIMEOUT_MS });
  });
});

test.describe('Keyword Search', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });
  test('searching for "food" by keyword returns results', async ({ page }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
  });

  test('no results page is shown for gibberish query', async ({ page }) => {
    await performSearch(page, {
      query: 'xyzzyspoonshift12345',
      query_label: 'xyzzyspoonshift12345',
      query_type: 'text',
    });

    const noResultsCard = page.getByTestId('no-results-card');
    const resultTotal = page.locator('#result-total');

    const hasNoResults = await noResultsCard.isVisible().catch(() => false);
    if (!hasNoResults) {
      const totalText = await resultTotal.textContent();
      const total = parseTotalFromResultText(totalText ?? '');
      expect(total).toBe(0);
    } else {
      await expect(noResultsCard).toBeVisible();
    }
  });
});

test.describe('Search Result Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });
  test('pagination controls appear when results exceed one page', async ({
    page,
  }) => {
    const { total } = await searchWithFallbackQueries(page);

    test.skip(total <= 10, `Expected >10 results for pagination, got ${total}`);

    const pagination = page.getByTestId('pagination');
    await expect(pagination).toBeVisible();

    const nextBtn = page.getByTestId('pagination-next');
    await expect(nextBtn).toBeVisible();
  });

  test('clicking next page loads a later page of results', async ({ page }) => {
    const { total } = await searchWithFallbackQueries(page);

    test.skip(total <= 10, `Expected >10 results for pagination, got ${total}`);

    const beforeUrl = new URL(page.url());
    const beforePage = Number(beforeUrl.searchParams.get('page') ?? '1');

    const nextBtn = page.getByTestId('pagination-next');
    await nextBtn.click();

    await expect(page).toHaveURL(
      (url) => {
        const urlPage = Number(url.searchParams.get('page') ?? '1');
        return urlPage > beforePage;
      },
      { timeout: SEARCH_NAV_TIMEOUT_MS },
    );

    const afterUrl = new URL(page.url());
    const afterPage = Number(afterUrl.searchParams.get('page') ?? '1');
    expect(afterPage).toBeGreaterThan(beforePage);

    await expect(page.locator('#result-total')).toBeVisible();
  });
});

test.describe('Search Filters', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });
  test('filter panel is visible on search results page', async ({ page }) => {
    await performSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    const filterPanel = page.locator('#filter-panel');
    await expect(filterPanel).toBeVisible();
  });

  test('filter checkboxes can be toggled', async ({ page }) => {
    await searchWithFallbackQueries(page);

    const filterPanel = page.locator('#filter-panel');
    await expect(filterPanel).toBeVisible();

    const checkboxes = filterPanel.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    const firstCheckbox = checkboxes.first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('data-state', 'checked', {
      timeout: SEARCH_NAV_TIMEOUT_MS,
    });

    await expect(page.locator('#search-container')).toBeVisible();
  });

  for (const locale of ['en', 'es'] as const) {
    test(`selecting a facet narrows results, marks it selected, and adds it to the URL (${locale})`, async ({
      page,
    }) => {
      // `searchWithFallbackQueries` calls `goHome` (always `/en`) between
      // attempts, so switch language *after* it settles on results rather
      // than before - matches the existing search-then-switch pattern in
      // translations.spec.ts.
      await searchWithFallbackQueries(page);

      if (locale !== 'en') {
        await switchLanguage(page, locale);
      }

      await waitForFilterPanelInteractive(page);

      const filterPanel = page.locator('#filter-panel');
      await expect(filterPanel).toBeVisible();
      expect(await filterPanel.getByRole('checkbox').count()).toBeGreaterThan(
        0,
      );

      const resultsBefore = await getResultTotalNumber(page);
      expect(decodeURIComponent(page.url())).not.toContain('filters[');

      await markFirstNEnabledFilters(page, 1);

      const selectedFilterIds = await getSelectedFilterIds(page);
      expect(selectedFilterIds.length).toBeGreaterThan(0);

      const resultsAfter = await getResultTotalNumber(page);
      expect(resultsAfter).toBeLessThanOrEqual(resultsBefore);

      expect(decodeURIComponent(page.url())).toContain('filters[');
    });
  }
});
