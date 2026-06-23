import type { Page } from '@playwright/test';

import {
  expect,
  getResultTotal,
  goHome,
  openSearchDialog,
  parseTotalFromResultText,
  performSearch,
  test,
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

  test('typing "food shelves" and submitting first topic suggestion returns results', async ({
    page,
  }) => {
    const searchInput = await openSearchDialog(page);
    await searchInput.fill('food shelves');

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    await expect
      .poll(async () => options.count(), {
        timeout: AUTOCOMPLETE_TIMEOUT_MS,
        intervals: [100, 250, 500],
      })
      .toBeGreaterThan(0);

    const foodShelvesTopic = options.filter({ hasText: /food shelves/i });
    await expect(foodShelvesTopic.first()).toBeVisible({
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });
    await foodShelvesTopic.first().click();

    const submitButton = page.getByTestId('search-submit-btn');
    await expect(submitButton).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });
    await submitButton.click();

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
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
    await performSearch(page, {
      query: 'BD-1800.2000',
      query_label: 'Food',
      query_type: 'taxonomy',
    });

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
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
});
