/**
 * Automated version of the MBOA weekly manual QA checklist
 * ("Connect211-QA Checklist.xlsx", sheet `11102026`) — every scenario that
 * does not need a signed-in user. The authenticated favorites scenarios live
 * in `mboa-qa-checklist-favorites.spec.ts`.
 *
 * One `test()` per checklist "Test Name", one `test.step()` per checklist
 * step (numbered as in the sheet) so a failure points at the same step a
 * manual tester would report.
 *
 * MBOA-only: all data (guided topics, MN counties, MN resources) is specific
 * to the MN Aging & Disability Resources tenant. See
 * `e2e/fixtures/mboa-qa-checklist.ts`.
 */
import { type Page } from '@playwright/test';

import { getCurrentTenantKey } from './fixtures/tenants';
import {
  MBOA_DULUTH_ADDRESS,
  MBOA_FILTERS,
  MBOA_GUIDED_TOPICS,
  MBOA_LANGUAGES,
  MBOA_LOGO_LINK_NAME,
  MBOA_RESOURCES,
  MBOA_SEARCHES,
  MBOA_ST_PAUL_ADDRESS,
} from './fixtures/mboa-qa-checklist';
import {
  checkFilterByLabel,
  chooseLocationFromSearchPage,
  clickHeaderHome,
  expect,
  expectLocationBelowSearch,
  expectNoLocationBelowSearch,
  expectOnHomePage,
  expectPageUrl,
  expectResultsDisplayed,
  expectSearchBarText,
  expectSortLabel,
  favoriteTopResultsLocally,
  expectLocalFavorites,
  getAutocompleteOptionInGroup,
  getFilterCheckboxByLabel,
  getFilterOptionCount,
  getResultCardByName,
  getResultCards,
  getResultTitles,
  getResultTotalNumber,
  goHome,
  goToLocalFavorites,
  isSearchResourceDetailUrl,
  isSearchResultsListUrl,
  openGuidedSearchTopic,
  openSearchDialog,
  resetLocalFavoritesStorage,
  selectSortOption,
  submitSearchDialog,
  switchLanguage,
  test,
  waitForAutocompleteOptions,
  waitForSearchResultsSettled,
} from './helpers';
import {
  ASYNC_UI_TIMEOUT_MS,
  PAGE_LOAD_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

test.skip(
  getCurrentTenantKey() !== 'MBOA',
  'MBOA QA checklist — data is specific to the MN Aging & Disability Resources tenant',
);

/** Checklist step 1 of every scenario: fresh home page, no query or location. */
async function openFreshHomePage(page: Page) {
  await goHome(page);
  await expectOnHomePage(page);
  await expect(page.getByTestId('search-trigger').first()).toHaveText(
    /food, clothing, shelter/i,
  );
}

/** "Click on the Search Bar" → the search dialog opens with its input focused. */
async function clickSearchBar(page: Page) {
  const input = await openSearchDialog(page);
  await expect(input).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await expect(input).toBeFocused();
  return input;
}

/**
 * Shared tail of the Search scenarios: "Add my location" → St. Paul address →
 * Search, then the results are a subset (by total) of the location-less
 * search and the address is shown below the search bar.
 *
 * Sort label after adding a location (PR #1185): a located **taxonomy**
 * search is reported as "Nearest First" (Norse-API already orders it by
 * distance); a located **text** search keeps "Most Relevant" — a location is
 * a filter there, not a ranking intent.
 */
async function addStPaulLocationAndSearch(
  page: Page,
  totalBefore: number,
  expectedSort: 'Nearest First' | 'Most Relevant',
) {
  await chooseLocationFromSearchPage(page, MBOA_ST_PAUL_ADDRESS);
  await submitSearchDialog(page);

  await expectPageUrl(
    page,
    (u) => u.searchParams.get('location') === MBOA_ST_PAUL_ADDRESS.suggestion,
  );
  await expectLocationBelowSearch(page, MBOA_ST_PAUL_ADDRESS.suggestion);
  expect(await getResultTotalNumber(page)).toBeLessThanOrEqual(totalBefore);
  await expectSortLabel(page, expectedSort);
}

/** Results-page state right after a location-less search. */
async function expectLocationlessResults(page: Page, searchBarText: string) {
  await expectSearchBarText(page, searchBarText);
  await expectNoLocationBelowSearch(page);
  await expectResultsDisplayed(page);
  await expectSortLabel(page, 'Most Relevant');
}

/** The "What's Here" taxonomy links of the first result card. */
function firstCardTaxonomyLinks(page: Page) {
  return getResultCards(page)
    .first()
    .locator('[data-component-id="categories"] a');
}

/**
 * Clicks a "What's Here" taxonomy link and asserts the search switched to it:
 * the URL carries the taxonomy (as `query_label`) and the search bar shows it.
 */
async function followTaxonomyLink(
  page: Page,
  link: ReturnType<Page['locator']>,
) {
  const taxonomyName = ((await link.textContent()) ?? '').trim();
  expect(taxonomyName).not.toBe('');

  await link.click();
  await expectPageUrl(
    page,
    (u) =>
      isSearchResultsListUrl(u) &&
      u.searchParams.get('query_type') === 'taxonomy' &&
      u.searchParams.get('query_label') === taxonomyName,
  );
  await waitForSearchResultsSettled(page);
  await expectSearchBarText(page, taxonomyName);
  await expectResultsDisplayed(page);
}

/**
 * Waits for a top-level navigation to `url` anywhere in the browser context
 * (i.e. in a new tab). Follows redirects back to the original request.
 *
 * Asserting on the network rather than `popup.url()`: headless Chromium has
 * no PDF viewer, so a tab opened onto a PDF never reports its URL (it stays
 * `""`) even though the document request succeeds.
 */
function waitForNavigationTo(page: Page, url: string) {
  return page.context().waitForEvent('request', {
    timeout: PAGE_LOAD_TIMEOUT_MS,
    predicate: (request) => {
      if (!request.isNavigationRequest()) return false;
      let first = request;
      while (first.redirectedFrom()) first = first.redirectedFrom()!;
      return first.url() === url;
    },
  });
}

/** Clicks an external link and asserts it opens in a new browser tab. */
async function expectOpensInNewTab(
  page: Page,
  link: ReturnType<Page['locator']>,
) {
  await expect(link).toHaveAttribute('target', '_blank');
  const href = (await link.getAttribute('href')) ?? '';
  expect(href).toMatch(/^https?:\/\//);

  const [popup, request] = await Promise.all([
    page.context().waitForEvent('page', { timeout: UI_SHELL_TIMEOUT_MS }),
    waitForNavigationTo(page, href),
    link.click(),
  ]);
  try {
    expect(popup).not.toBe(page);
    expect(request.url()).toMatch(/^https?:\/\//);
  } finally {
    await popup.close();
  }
  return href;
}

/** Opens a result's details page from the results list by clicking its name. */
async function openResultDetails(
  page: Page,
  link: ReturnType<Page['locator']>,
) {
  await link.click();
  await expectPageUrl(page, isSearchResourceDetailUrl);
  await expect(
    page.locator('[data-component-id="resourceName"]').first(),
  ).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
}

/** The details page "<Results" link back to the results list. */
async function backToResults(page: Page) {
  await page.getByRole('link', { name: 'Results', exact: true }).click();
  await expectPageUrl(page, isSearchResultsListUrl);
  await waitForSearchResultsSettled(page);
}

test.describe('MBOA QA checklist', () => {
  test.describe('Guided Search', () => {
    test('Link Navigation', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Tax help" under "Money/finances"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectSearchBarText(page, MBOA_GUIDED_TOPICS.taxHelp.name);
        await expectNoLocationBelowSearch(page);
        await expectResultsDisplayed(page);
      });

      await test.step('3. Header "Home"', () => clickHeaderHome(page));

      await test.step('4. "Personal support / PCA services" under "Help at home"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.personalSupport);
        await expectSearchBarText(
          page,
          MBOA_GUIDED_TOPICS.personalSupport.searchLabel,
        );
        await expectResultsDisplayed(page);
      });

      await test.step('5. Header "Home"', () => clickHeaderHome(page));

      await test.step('6. "Essential Community Supports (ECS)" under "Waiver Providers"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.ecsWaiver);
        await expectResultsDisplayed(page);

        const ecsFilter = await getFilterCheckboxByLabel(
          page,
          'Payment',
          MBOA_GUIDED_TOPICS.ecsWaiver.paymentFilter,
        );
        await expect(ecsFilter).toHaveAttribute('data-state', 'checked');

        // "Results that all have the ECS filter": the facet count for the
        // checked filter equals the whole result total.
        expect(
          await getFilterOptionCount(
            page,
            'Payment',
            MBOA_GUIDED_TOPICS.ecsWaiver.paymentFilter,
          ),
        ).toBe(await getResultTotalNumber(page));
      });
    });
  });

  test.describe('Search', () => {
    test('Topics Navigation', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      const input = await test.step('2. Click the search bar', () =>
        clickSearchBar(page));

      await test.step('3. Type "assisted living" → "Topics" option', async () => {
        await input.fill(MBOA_SEARCHES.topic.typed);
        await waitForAutocompleteOptions(page);
        await expect(
          getAutocompleteOptionInGroup(
            page,
            'Topics',
            MBOA_SEARCHES.topic.option,
          ).first(),
        ).toBeVisible({ timeout: ASYNC_UI_TIMEOUT_MS });
      });

      await test.step('4. Select the "Assisted living" topic', async () => {
        await getAutocompleteOptionInGroup(
          page,
          'Topics',
          MBOA_SEARCHES.topic.option,
        )
          .first()
          .click();
        await expect(input).toHaveValue(MBOA_SEARCHES.topic.option);
      });

      let totalWithoutLocation = 0;
      await test.step('5. Search', async () => {
        await submitSearchDialog(page);
        await expectLocationlessResults(page, MBOA_SEARCHES.topic.option);
        totalWithoutLocation = await getResultTotalNumber(page);
      });

      await test.step('6-8. Add the St. Paul location and search', () =>
        addStPaulLocationAndSearch(
          page,
          totalWithoutLocation,
          'Nearest First',
        ));

      await test.step('9. Sort by "Resource Name" → alphabetical', async () => {
        await selectSortOption(page, 'Resource Name');
        const titles = await getResultTitles(page, 25);
        const collator = new Intl.Collator('en', { sensitivity: 'base' });
        expect(titles).toEqual([...titles].sort(collator.compare));
      });
    });

    test('Taxonomy Navigation', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      const input = await test.step('2. Click the search bar', () =>
        clickSearchBar(page));

      const option = getAutocompleteOptionInGroup(
        page,
        'Taxonomies',
        new RegExp(
          `^\\s*${MBOA_SEARCHES.taxonomy.label}\\s*${MBOA_SEARCHES.taxonomy.code}\\s*$`,
        ),
      );

      await test.step('3. Type "Respite Care" → "Respite Care PH-7000" taxonomy option', async () => {
        await input.fill(MBOA_SEARCHES.taxonomy.typed);
        await waitForAutocompleteOptions(page);
        await expect(option.first()).toBeVisible({
          timeout: ASYNC_UI_TIMEOUT_MS,
        });
      });

      await test.step('4. Select "Respite Care PH-7000"', async () => {
        await option.first().click();
        await expect(input).toHaveValue(MBOA_SEARCHES.taxonomy.label);
      });

      let totalWithoutLocation = 0;
      await test.step('5. Search', async () => {
        await submitSearchDialog(page);
        await expectPageUrl(
          page,
          (u) => u.searchParams.get('query') === MBOA_SEARCHES.taxonomy.code,
        );
        await expectLocationlessResults(page, MBOA_SEARCHES.taxonomy.label);
        totalWithoutLocation = await getResultTotalNumber(page);
      });

      // Failed in the 11/10/2026 manual run: sort stayed "Most Relevant".
      await test.step('6-9. Add the St. Paul location and search', () =>
        addStPaulLocationAndSearch(
          page,
          totalWithoutLocation,
          'Nearest First',
        ));
    });

    test('Text', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      const input = await test.step('2. Click the search bar', () =>
        clickSearchBar(page));

      await test.step('6. Type "Monarch Healthcare Management"', async () => {
        await input.fill(MBOA_SEARCHES.text);
        await expect(input).toHaveValue(MBOA_SEARCHES.text);
      });

      let totalWithoutLocation = 0;
      await test.step('7. Press Enter without picking a suggestion', async () => {
        await input.press('Enter');
        await expectPageUrl(
          page,
          (u) =>
            isSearchResultsListUrl(u) &&
            u.searchParams.get('query_type') === 'text' &&
            u.searchParams.get('query') === MBOA_SEARCHES.text,
        );
        await waitForSearchResultsSettled(page);
        await expectLocationlessResults(page, MBOA_SEARCHES.text);
        totalWithoutLocation = await getResultTotalNumber(page);
      });

      await test.step('8-10. Add the St. Paul location and search', () =>
        addStPaulLocationAndSearch(
          page,
          totalWithoutLocation,
          'Most Relevant',
        ));
    });

    test('Suggestions', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      const input =
        await test.step('2. Click the search bar → 10 "I need…" suggestions', async () => {
          const searchInput = await clickSearchBar(page);
          await waitForAutocompleteOptions(page);
          const suggestions = page
            .getByTestId('autocomplete-listbox')
            .getByRole('group', { name: 'Suggestions', exact: true })
            .getByTestId('autocomplete-option');
          await expect(suggestions).toHaveCount(10);
          for (const text of await suggestions.allTextContents()) {
            expect(text.trim()).toMatch(/^I need/);
          }
          return searchInput;
        });

      await test.step('3. Select "I need transportation"', async () => {
        await getAutocompleteOptionInGroup(
          page,
          'Suggestions',
          MBOA_SEARCHES.suggestion,
        )
          .first()
          .click();
        await expect(input).toHaveValue(MBOA_SEARCHES.suggestion);
      });

      let totalWithoutLocation = 0;
      await test.step('4. Search', async () => {
        await submitSearchDialog(page);
        await expectLocationlessResults(page, MBOA_SEARCHES.suggestion);
        totalWithoutLocation = await getResultTotalNumber(page);
      });

      // Failed in the 11/10/2026 manual run: sort stayed "Most Relevant".
      await test.step('5-7. Add the St. Paul location and search', () =>
        addStPaulLocationAndSearch(
          page,
          totalWithoutLocation,
          'Nearest First',
        ));
    });
  });

  test.describe('Favorites', () => {
    test.beforeEach(async ({ page, context }) => {
      await context.clearCookies();
      await goHome(page);
      await resetLocalFavoritesStorage(page);
    });

    // Steps 1-11 (anonymous, browser-local list). Steps 12-16 sign in and
    // continue in `mboa-qa-checklist-favorites.spec.ts`.
    test('Anonymous User Lists', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Shopping help" guided search', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.shoppingHelp);
        await expectResultsDisplayed(page);
      });

      const savedNames = await test.step('3. Favorite the top 3 results', () =>
        favoriteTopResultsLocally(page, 3));

      await test.step('4. Header "Favorites" → My Saved Resources', async () => {
        await goToLocalFavorites(page);
        await expect(
          page.getByRole('heading', { name: 'My Saved Resources' }),
        ).toBeVisible();
        await expectLocalFavorites(page, savedNames);
      });

      const removed = savedNames[0];
      await test.step('5. Click the "remove" (slashed heart) icon', async () => {
        await page
          .getByTestId('remove-from-list-btn')
          .and(page.getByLabel(`Remove from list ${removed}`))
          .click();
        await expect(page.getByRole('dialog')).toContainText(
          /remove from list\?/i,
        );
      });

      await test.step('6. Remove', async () => {
        await page.getByTestId('remove-from-current-list-confirm-btn').click();
        await expectLocalFavorites(page, savedNames.slice(1));
        await expect(
          page.getByTestId('resource-link').filter({ hasText: removed }),
        ).toHaveCount(0);
      });

      await test.step('7. Print → "Print Directory" format options', async () => {
        await page.getByTestId('print-local-directory-btn').click();
        const dialog = page.getByRole('dialog', { name: 'Print Directory' });
        await expect(dialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
        await expect(dialog.getByRole('radio')).not.toHaveCount(0);
      });

      await test.step('8. Pick a format and print → PDF in a new tab', async () => {
        const dialog = page.getByRole('dialog', { name: 'Print Directory' });
        await dialog.getByRole('radio', { name: /summary listing/i }).click();
        // The PDF is rendered client-side into a `blob:` URL that a new tab
        // navigates to. Read the bytes back from the opener (same origin;
        // the URL stays valid while the PDF tab is open).
        const [pdfTab, pdfRequest] = await Promise.all([
          page
            .context()
            .waitForEvent('page', { timeout: PAGE_LOAD_TIMEOUT_MS }),
          page.context().waitForEvent('request', {
            timeout: PAGE_LOAD_TIMEOUT_MS,
            predicate: (r) =>
              r.isNavigationRequest() && r.url().startsWith('blob:'),
          }),
          dialog.getByRole('button', { name: 'Print', exact: true }).click(),
        ]);
        try {
          const header = await page.evaluate(async (url) => {
            const bytes = await (await fetch(url)).arrayBuffer();
            return new TextDecoder().decode(bytes.slice(0, 5));
          }, pdfRequest.url());
          expect(header).toBe('%PDF-');
        } finally {
          await pdfTab.close();
        }
      });

      await test.step('9. "Clear All" → "Are you sure?"', async () => {
        await page.getByTestId('purge-local-list-btn').click();
        await expect(page.getByRole('dialog')).toContainText(/are you sure/i);
      });

      await test.step('10. Clear all → empty list', async () => {
        await page.getByTestId('purge-list-confirm-btn').click();
        await expect(page.getByTestId('resource-link')).toHaveCount(0, {
          timeout: ASYNC_UI_TIMEOUT_MS,
        });
        await expect(page.getByText('No saved resources yet')).toBeVisible();
      });

      await test.step('11. "Emergency shelter" → favorite top 3 → Favorites', async () => {
        await goHome(page);
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.emergencyShelter);
        const names = await favoriteTopResultsLocally(page, 3);
        await goToLocalFavorites(page);
        await expectLocalFavorites(page, names);
      });
    });
  });

  test.describe('Filters', () => {
    test('Filters', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      const input = await test.step('2. Click the search bar', () =>
        clickSearchBar(page));

      const option = getAutocompleteOptionInGroup(
        page,
        'Taxonomies',
        new RegExp(
          `^\\s*${MBOA_SEARCHES.homeRepair.label}\\s*${MBOA_SEARCHES.homeRepair.code.replace(/\./g, '\\.')}\\s*$`,
        ),
      );

      await test.step('3. Type "Home repair" → "General Minor Home Repair Programs" taxonomy', async () => {
        await input.fill(MBOA_SEARCHES.homeRepair.typed);
        await waitForAutocompleteOptions(page);
        await expect(option.first()).toBeVisible({
          timeout: ASYNC_UI_TIMEOUT_MS,
        });
      });

      await test.step('4. Select it', async () => {
        await option.first().click();
        await expect(input).toHaveValue(MBOA_SEARCHES.homeRepair.label);
      });

      let unfilteredTotal = 0;
      await test.step('5. Search', async () => {
        await submitSearchDialog(page);
        await expectSearchBarText(page, MBOA_SEARCHES.homeRepair.label);
        await expectNoLocationBelowSearch(page);
        unfilteredTotal = await getResultTotalNumber(page);
      });

      await test.step('6. Check "Title III" (Payment)', () =>
        applyFilterAndExpectCountMatches(
          page,
          MBOA_FILTERS.titleIII,
          unfilteredTotal,
        ));

      await test.step('7. Check "St. Louis County" (Area Served by County)', async () => {
        const total = await getResultTotalNumber(page);
        await applyFilterAndExpectCountMatches(
          page,
          MBOA_FILTERS.stLouisCounty,
          total,
        );
      });

      await test.step('8-9. Every result has "Title III" and serves St. Louis County', async () => {
        const count = await page.getByTestId('resource-link').count();
        for (let i = 0; i < count; i += 1) {
          await openResultDetails(
            page,
            page.getByTestId('resource-link').nth(i),
          );
          await expect(page.locator('main')).toContainText(
            /Other Information[\s\S]*Title III/,
          );
          await expect(page.locator('main')).toContainText(
            /Site Area Served[\s\S]*St\.? Louis/i,
          );
          await backToResults(page);
        }
      });

      await test.step('10. "Add my location"', async () => {
        await chooseLocationFromSearchPage(page, MBOA_DULUTH_ADDRESS);
      });

      await test.step('11-13. Duluth address → Search', async () => {
        await submitSearchDialog(page);
        await expectLocationBelowSearch(page, MBOA_DULUTH_ADDRESS.suggestion);
        expect(await getResultTotalNumber(page)).toBeLessThan(unfilteredTotal);
        await expect(
          page.locator('#filter-panel [role="checkbox"][data-state="checked"]'),
        ).toHaveCount(0);
        await expect(
          getResultCards(page).first().locator('[data-component-id="address"]'),
        ).toContainText(MBOA_DULUTH_ADDRESS.city.split(',')[0]);
      });

      await test.step('14. Check "Community Alternative Care (CAC) Waiver"', async () => {
        const total = await getResultTotalNumber(page);
        await applyFilterAndExpectCountMatches(
          page,
          MBOA_FILTERS.cacWaiver,
          total,
        );
      });

      await test.step('15. Open the result → CAC Waiver under "Other Information"', async () => {
        await openResultDetails(
          page,
          page.getByTestId('resource-link').first(),
        );
        await expect(page.locator('main')).toContainText(
          /Other Information[\s\S]*Community Alternative Care \(CAC\) Waiver/,
        );
      });
    });

    test('Hyperlinks', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Emergency shelter" under "Housing"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.emergencyShelter);
        await expectSearchBarText(
          page,
          MBOA_GUIDED_TOPICS.emergencyShelter.name,
        );
        await expectNoLocationBelowSearch(page);
      });

      await test.step('3. First result → a "What\'s Here" taxonomy link', () =>
        followTaxonomyLink(page, firstCardTaxonomyLinks(page).first()));

      await test.step("4. A result's website URL opens in a new tab", async () => {
        const websiteLink = page
          .locator('[data-component-id="website"] a[href^="http"]')
          .first();
        await expect(websiteLink).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
        await expectOpensInNewTab(page, websiteLink);
      });

      await test.step('5. Resource name → details page', () =>
        openResultDetails(
          page,
          getResultCards(page)
            .filter({ has: page.locator('[data-component-id="website"] a') })
            .first()
            .getByTestId('resource-link'),
        ));

      await test.step('6. Details website URL opens in a new tab', async () => {
        const websiteLink = page
          .locator('[data-component-id="website"] a[href^="http"]')
          .first();
        await expectOpensInNewTab(page, websiteLink);
      });

      await test.step('7. Still on the details page', async () => {
        await expectPageUrl(page, isSearchResourceDetailUrl);
      });

      await test.step('8. Details "What\'s Here" taxonomy link', () =>
        followTaxonomyLink(
          page,
          page.locator('[data-component-id="categories"] a').first(),
        ));
    });
  });

  test.describe('Homepage', () => {
    test('Homepage Verification', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Tax help"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectResultsDisplayed(page);
      });

      await test.step('3. Header "Home"', () => clickHeaderHome(page));

      await test.step('4. "Tax help" again', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectResultsDisplayed(page);
      });

      await test.step('5. Header language selector lists languages', async () => {
        const languageSelect = page
          .locator('#app-header')
          .getByRole('combobox');
        await languageSelect.click();
        await expect(
          page.getByRole('option', { name: /\(mww\)$/ }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
      });

      await test.step('6. Switch to Hmong', async () => {
        await switchLanguage(page, MBOA_LANGUAGES.hmong.code);
        await expectDocumentLanguage(page, MBOA_LANGUAGES.hmong.htmlLang);
        await expectResultsDisplayed(page);
      });

      let lastLanguage: string = MBOA_LANGUAGES.hmong.htmlLang;
      await test.step('7. Switch through 2 more languages', async () => {
        for (const language of MBOA_LANGUAGES.others) {
          await switchLanguage(page, language.code);
          await expectDocumentLanguage(page, language.htmlLang);
          await expectResultsDisplayed(page);
          lastLanguage = language.htmlLang;
        }
      });

      await test.step('8. Details page stays in the selected language', async () => {
        await openResultDetails(
          page,
          page.getByTestId('resource-link').first(),
        );
        await expectDocumentLanguage(page, lastLanguage);
      });

      await test.step('9. Logo → home page in the selected language', async () => {
        await page
          .locator('#app-header')
          .getByRole('link', { name: MBOA_LOGO_LINK_NAME })
          .first()
          .click();
        await expectOnHomePage(page);
        await expectDocumentLanguage(page, lastLanguage);
      });

      await test.step('10. Back to English', async () => {
        await switchLanguage(page, 'en');
        await expectDocumentLanguage(page, 'en');
        await expectOnHomePage(page);
      });
    });
  });

  test.describe('Details Page', () => {
    test('Details Page Verification', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Assisted living" under "Housing"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.assistedLiving);
        await expectSearchBarText(page, MBOA_GUIDED_TOPICS.assistedLiving.name);
        await expectNoLocationBelowSearch(page);
      });

      await test.step('2b. Check "Itasca County"', async () => {
        const before = await getResultTotalNumber(page);
        await applyFilterAndExpectCountMatches(
          page,
          MBOA_FILTERS.itascaCounty,
          before,
        );
      });

      await test.step('3. Sort by "Resource Name" → open Oak Hill Assisted Living', async () => {
        await selectSortOption(page, 'Resource Name');
        await openResultDetails(
          page,
          getResultCardByName(page, MBOA_RESOURCES.oakHill).getByTestId(
            'resource-link',
          ),
        );
        await expect(
          page.locator('[data-component-id="resourceName"]').first(),
        ).toContainText(MBOA_RESOURCES.oakHill);
      });

      await test.step('4. Details page has the expected sections', async () => {
        const main = page.locator('main');
        for (const section of [
          'Assisted Living Facility',
          'Grand Rapids, MN',
          'Website',
          'Email',
          'Site Area Served',
          'Itasca County',
          'Quality Information',
          'Other Information',
          'Payment',
          'Last Update',
          "What's Here",
          'Assisted Living Facilities',
          'Get Directions',
          'Providing organization',
        ]) {
          await expect(main, `missing "${section}"`).toContainText(section);
        }
        await expect(
          page.locator('[data-component-id="phoneNumbers"] a[href^="tel:"]'),
        ).not.toHaveCount(0);
      });

      await test.step('5. Blue "Waiver" badge', async () => {
        const badge = page
          .locator('[data-component-id="badges"]')
          .first()
          .getByText('Waiver', { exact: true });
        await expect(badge).toBeVisible();
        await expect(badge.locator('..')).toHaveCSS(
          'background-color',
          'rgb(0, 68, 181)',
        );
      });

      await test.step('6. UDALSA PDF link opens in a new tab', async () => {
        await expect(page.locator('main')).toContainText(
          'Uniform Disclosure of Assisted Living Services & Amenities (UDALSA)',
        );
        const pdfLink = page.locator('main a[href*="udalsa"][href$=".pdf"]');
        await expect(pdfLink).toHaveCount(1);
        await expectOpensInNewTab(page, pdfLink);
      });
    });

    test('Search Results Page', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Tax help"', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectResultsDisplayed(page);
      });

      await test.step('3. "Minnesota Department of Revenue" result card', async () => {
        const card = getResultCardByName(page, MBOA_RESOURCES.mnRevenue);
        await expect(card).toHaveCount(1);
        await expect(card.getByTestId('favorite-btn')).toBeVisible();
        for (const component of [
          'serviceName',
          'address',
          'phone',
          'website',
          'description',
          'categories',
          'actionButtons',
        ]) {
          await expect(
            card.locator(`[data-component-id="${component}"]`).first(),
            `missing "${component}" on the card`,
          ).toBeVisible();
        }
        await expect(card).toContainText('Tax Help');
        await expect(card).toContainText('St. Paul, MN');
        await expect(card).toContainText("What's Here");
        // Card action buttons are named "<Action> <resource name>"
        // ("See more: <name>", "Directions <name> opens in a new tab").
        for (const action of ['Call', 'Website', 'Directions', 'See more:']) {
          await expect(
            card
              .locator('[data-component-id="actionButtons"]')
              .getByRole('link', {
                name: new RegExp(`^${action} ${MBOA_RESOURCES.mnRevenue}`),
              })
              .or(
                card
                  .locator('[data-component-id="actionButtons"]')
                  .getByRole('button', {
                    name: new RegExp(`^${action} ${MBOA_RESOURCES.mnRevenue}`),
                  }),
              ),
            `missing "${action}" action`,
          ).toBeVisible();
        }
      });
    });
  });

  test.describe('Feedback', () => {
    test('Submit Feedback', async ({ page }) => {
      await test.step('1. Fresh home page', () => openFreshHomePage(page));

      await test.step('2. "Tax help" → results', async () => {
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectSearchBarText(page, MBOA_GUIDED_TOPICS.taxHelp.name);
        await expect(page.getByTestId('resource-link')).not.toHaveCount(0);
      });

      await test.step('3. First result → details page', () =>
        openResultDetails(page, page.getByTestId('resource-link').first()));

      await test.step('4-5. Header "Feedback" opens the form pre-filled with this URL', () =>
        expectFeedbackLinkForCurrentPage(page));

      await test.step('6. "Tax help" from home again', async () => {
        await clickHeaderHome(page);
        await openGuidedSearchTopic(page, MBOA_GUIDED_TOPICS.taxHelp);
        await expectResultsDisplayed(page);
      });

      await test.step('7-8. Header "Feedback" opens the form pre-filled with this URL', () =>
        expectFeedbackLinkForCurrentPage(page));
    });
  });
});

/**
 * Checks a filter and asserts the results narrowed to exactly the count shown
 * next to that filter (and fewer than `previousTotal`).
 */
async function applyFilterAndExpectCountMatches(
  page: Page,
  { group, label }: { group: string; label: string },
  previousTotal: number,
) {
  const shownCount = await getFilterOptionCount(page, group, label);
  await checkFilterByLabel(page, group, label);
  await expectPageUrl(page, (u) =>
    [...u.searchParams.values()].includes(label),
  );
  await waitForSearchResultsSettled(page);

  const total = await getResultTotalNumber(page);
  expect(total).toBe(shownCount);
  expect(total).toBeLessThan(previousTotal);
}

/** Asserts `<html lang>` reflects the selected language. */
async function expectDocumentLanguage(page: Page, lang: string) {
  await expect(page.locator('html')).toHaveAttribute('lang', lang, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/**
 * The header "Feedback" link opens the "Report a data problem" form in a new
 * tab with `referring_url` set to the page the user was on. Only the link's
 * target is checked — the external form is never submitted.
 */
async function expectFeedbackLinkForCurrentPage(page: Page) {
  const feedback = page
    .locator('#app-header')
    .getByRole('link', { name: /^Feedback/ });
  await expect(feedback).toHaveAttribute('target', '_blank');
  await expect
    .poll(
      async () => {
        const href = (await feedback.getAttribute('href')) ?? '';
        const referring = new URL(href).searchParams.get('referring_url');
        return referring ? normalizeComparableUrl(referring) : null;
      },
      { timeout: ASYNC_UI_TIMEOUT_MS },
    )
    .toBe(normalizeComparableUrl(page.url()));

  const href = (await feedback.getAttribute('href')) ?? '';
  expect(href).toMatch(/data-problem/);
}

/**
 * Normalizes a URL for comparison: drops the transient `entry` analytics
 * param (`entry=topic_card`, removed once the view is tracked), and ignores
 * a trailing slash and `+`/`%20` encoding differences.
 */
function normalizeComparableUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete('entry');
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}
