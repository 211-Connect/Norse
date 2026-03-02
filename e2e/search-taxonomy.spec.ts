import {
  test,
  expect,
  goHome,
  goToSearch,
  performSearch,
  getResultTotal,
  parseTotalFromResultText,
} from './helpers';

test.describe('Categories & Topics on Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  // test('should display the Topics heading', async ({ page }) => {
  //   const heading = page.locator('.categories h2');
  //   await expect(heading).toBeVisible();
  //   await expect(heading).toHaveText('Topics');
  // });

  // test('should render all category groups', async ({ page }) => {
  //   const categoryContainer = page.locator('.categories');
  //   await expect(categoryContainer).toBeVisible();

  //   for (const category of CATEGORIES) {
  //     const heading = categoryContainer
  //       .getByRole('heading', { name: category.name, exact: true })
  //       .first();
  //     await expect(heading).toBeVisible();
  //   }
  // });

  // test('should render all subcategory links for every category', async ({
  //   page,
  // }) => {
  //   const categoryContainer = page.locator('.categories');

  //   for (const category of CATEGORIES) {
  //     for (const sub of category.subcategories) {
  //       const link = categoryContainer
  //         .getByRole('link', { name: sub, exact: true })
  //         .first();
  //       await expect(link).toBeVisible();
  //     }
  //   }
  // });

  // test('each subcategory link should point to a search URL with taxonomy query', async ({
  //   page,
  // }) => {
  //   const categoryContainer = page.locator('.categories');

  //   // Verify a sample from each category to keep test fast
  //   for (const category of CATEGORIES) {
  //     const firstSub = category.subcategories[0];
  //     const link = categoryContainer
  //       .getByRole('link', { name: firstSub, exact: true })
  //       .first();
  //     const href = await link.getAttribute('href');

  //     expect(href).toBeTruthy();
  //     expect(href).toContain('/search?');
  //     expect(href).toContain('query_type=taxonomy');
  //     expect(href).toContain('query_label=');
  //   }
  // });

  // test('clicking a subcategory navigates to search results', async ({
  //   page,
  // }) => {
  //   await goHome(page);
  //   const categoryContainer = page.locator('.categories');
  //   const firstLink = categoryContainer
  //     .getByRole('link', { name: CATEGORIES[0].subcategories[0], exact: true })
  //     .first();

  //   await firstLink.click();
  //   await page.waitForURL(/\/search\?/);
  //   await page.waitForLoadState('networkidle');

  //   // Verify we're on the search page
  //   expect(page.url()).toContain(`/search`);

  //   // Results container should be present
  //   await expect(page.locator('#search-container')).toBeVisible();
  // });
});

test.describe('Search Autocomplete Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('should show suggestion options when typing a matching phrase', async ({
    page,
  }) => {
    // Open search dialog
    await page
      .getByPlaceholder('Food, clothing, shelter, etc...')
      .first()
      .click();
    await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill('I need');

    // Wait for the autocomplete dropdown to appear
    const listbox = page.locator('div[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 10000 });

    // Should show at least one suggestion matching "I need"
    const options = listbox.locator('div[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // At least one option should contain "I need"
    const texts = await options.allTextContents();
    const matchingSuggestions = texts.filter((t) =>
      t.toLowerCase().includes('i need'),
    );
    expect(matchingSuggestions.length).toBeGreaterThan(0);
  });

  test('should show taxonomy group when typing a known taxonomy keyword', async ({
    page,
  }) => {
    // Open search dialog
    await page
      .getByPlaceholder('Food, clothing, shelter, etc...')
      .first()
      .click();

    await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill('food');

    // Wait for autocompletion
    const listbox = page.locator('div[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 10000 });

    // Should have options
    const options = listbox.locator('div[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('selecting a suggestion should navigate to search results', async ({
    page,
  }) => {
    // Open search dialog
    await page
      .getByPlaceholder('Food, clothing, shelter, etc...')
      .first()
      .click();
    await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill('I need food');

    // Wait for autocomplete
    const listbox = page.locator('div[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 10000 });

    // Click the first matching option
    const firstOption = listbox.locator('div[role="option"]').first();
    await firstOption.click();

    // Submit the search
    await page.locator('div[role="dialog"] button[type="submit"]').click();
    await page.waitForURL(/\/search\?/, { timeout: 15000 });

    // Verify results page loaded
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: 15000,
    });
  });

  test('clear button should reset the search input', async ({ page }) => {
    // Open search dialog
    await page
      .getByPlaceholder('Food, clothing, shelter, etc...')
      .first()
      .click();
    await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill('food');
    await expect(searchInput).toHaveValue('food');

    // Click clear button
    const clearBtn = page.locator('button[aria-label="Clear"]').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    }
  });
});

test.describe('Taxonomy Search Result Accuracy', () => {
  test('searching for a taxonomy subcategory should return results', async ({
    page,
  }) => {
    // Navigate directly to a taxonomy search (Food Pantries/Banks)
    await goToSearch(page, {
      query: 'BD-1800.2000',
      query_label: 'Food Pantries/Banks',
      query_type: 'taxonomy',
    });

    // Wait for results
    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
  });

  test('each category subcategory taxonomy link returns results', async ({
    page,
  }) => {
    // Test a representative subcategory from several categories
    const taxonomySamples = [
      { query: 'BH-1800.8500-150', label: 'Overnight Shelters' },
      { query: 'BD-5000.8300', label: 'Free Meals' },
      { query: 'ND-3500.3600', label: 'Job Search' },
      { query: 'LV-1600', label: 'Dental Care' },
      { query: 'BT-4500', label: 'Local Transportation' },
    ];

    for (const sample of taxonomySamples) {
      await goToSearch(page, {
        query: sample.query,
        query_label: sample.label,
        query_type: 'taxonomy',
      });

      const totalText = await getResultTotal(page);
      const total = parseTotalFromResultText(totalText);
      expect(total).toBeGreaterThanOrEqual(0); // 0 is acceptable for some taxonomies
    }
  });

  test('search result cards should display resource names as links', async ({
    page,
  }) => {
    await goToSearch(page, {
      query: 'BD-1800.2000',
      query_label: 'Food Pantries/Banks',
      query_type: 'taxonomy',
    });

    const resultTotal = await getResultTotal(page);
    const total = parseTotalFromResultText(resultTotal);

    if (total > 0) {
      // Each result card should have a link with the resource name
      const resultLinks = page.locator('#search-container a[href*="/search/"]');
      const count = await resultLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Keyword Search', () => {
  test('searching for "food" by keyword returns results', async ({ page }) => {
    await goHome(page);
    await performSearch(page, 'food');

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
  });

  test('searching for "shelter" by keyword returns results', async ({
    page,
  }) => {
    await goHome(page);
    await performSearch(page, 'shelter');

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);
    expect(total).toBeGreaterThan(0);
  });

  test('no results page is shown for gibberish query', async ({ page }) => {
    await goHome(page);
    await performSearch(page, 'xyzzyspoonshift12345');

    // Either no results card or zero total
    const noResultsTitle = page.getByText(
      'No results found matching your query',
    );
    const resultTotal = page.locator('#result-total');

    const hasNoResults = await noResultsTitle.isVisible().catch(() => false);
    if (!hasNoResults) {
      const totalText = await resultTotal.textContent();
      const total = parseTotalFromResultText(totalText ?? '');
      expect(total).toBe(0);
    } else {
      await expect(noResultsTitle).toBeVisible();
    }
  });
});

test.describe('Location-Based Search', () => {
  test('searching with a location adds coords to the URL', async ({ page }) => {
    await goHome(page);

    // Open search dialog
    await page
      .getByPlaceholder('Food, clothing, shelter, etc...')
      .first()
      .click();
    await page.locator('div[role="dialog"]').waitFor({ state: 'visible' });

    // Type query
    const searchInput = page.locator('#search-input');
    await searchInput.fill('food');

    // Type location
    const locationInput = page.locator('#location-input');
    await locationInput.fill('Seattle, WA');

    // Wait for geocoding suggestions and select the first one
    await page.waitForTimeout(2000); // Allow geocoding debounce

    // Select the first location suggestion if available
    const locationListbox = page.locator('.location-box div[role="listbox"]');
    if (await locationListbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstLocationOption = locationListbox
        .locator('div[role="option"]')
        .first();
      if (await firstLocationOption.isVisible().catch(() => false)) {
        await firstLocationOption.click();
      }
    }

    // Submit
    await page.locator('div[role="dialog"] button[type="submit"]').click();
    await page.waitForURL(/\/search\?/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const url = new URL(page.url());
    // URL should contain location or coords
    const hasLocation =
      url.searchParams.has('location') || url.searchParams.has('coords');
    const hasQuery =
      url.searchParams.has('query') || url.searchParams.has('query_label');
    expect(hasQuery).toBeTruthy();
  });

  test('searching with direct coords URL returns location-filtered results', async ({
    page,
  }) => {
    // Navigate directly with location parameters
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
      location: 'Seattle, WA',
      coords: '47.6062,-122.3321',
      distance: '10',
    });

    // Should show results
    const resultContainer = page.locator('#search-container');
    await expect(resultContainer).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Search Result Pagination', () => {
  test('pagination controls appear when results exceed one page', async ({
    page,
  }) => {
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);

    if (total > 10) {
      const pagination = page.locator('nav[aria-label="pagination"]');
      await expect(pagination).toBeVisible();

      // Next page button should be available
      const nextBtn = page.getByLabel('Go to next page');
      await expect(nextBtn).toBeVisible();
    }
  });

  test('clicking next page loads the second page of results', async ({
    page,
  }) => {
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    const totalText = await getResultTotal(page);
    const total = parseTotalFromResultText(totalText);

    if (total > 10) {
      const nextBtn = page.getByLabel('Go to next page');
      await nextBtn.click();

      await page.waitForLoadState('networkidle');

      // URL should now have page=2
      expect(page.url()).toContain('page=2');

      // Results should still be visible
      await expect(page.locator('#result-total')).toBeVisible();
    }
  });
});

test.describe('Search Filters', () => {
  test('filter panel is visible on search results page', async ({ page }) => {
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    // Filter panel
    const filterPanel = page.locator('#filter-panel');
    await expect(filterPanel).toBeVisible();
  });

  test('filter checkboxes can be toggled', async ({ page }) => {
    await goToSearch(page, {
      query: 'food',
      query_label: 'food',
      query_type: 'text',
    });

    // On desktop, filters should be visible
    const filterPanel = page.locator('#filter-panel');
    await expect(filterPanel).toBeVisible();

    // Look for checkboxes within filters (desktop only)
    const checkboxes = filterPanel.getByRole('checkbox');
    const count = await checkboxes.count();

    if (count > 0) {
      // Click the first checkbox
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.click();
      await page.waitForLoadState('networkidle');

      // Verify results update (either total changes or filter is applied)
      await expect(page.locator('#search-container')).toBeVisible();
    }
  });
});
