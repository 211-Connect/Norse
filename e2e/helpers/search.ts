import { type Page, expect } from '@playwright/test';

import {
  ASYNC_UI_TIMEOUT_MS,
  AUTOCOMPLETE_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from '../timeouts';
import { waitForFilterPanelInteractive } from './filters';
import {
  expectPageUrl,
  isSearchResultsListUrl,
  parseTrailingInteger,
} from './url';

/**
 * Opens the search dialog and waits until the modal is visible (same contract
 * as the app’s a11y wiring for dialog semantics).
 */
export async function openSearchDialog(page: Page) {
  const trigger = page.getByTestId('search-trigger').first();
  await trigger.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
  await trigger.click();
  await page.getByTestId('search-dialog').waitFor({ state: 'visible' });
  return page.locator('#search-input');
}

/**
 * After submit navigates to /search, the dialog must be dismissed. The
 * dialog is a Radix `Dialog.Content`, which unmounts entirely once closed
 * (no `forceMount`) - `toBeHidden` covers both that case and a same-page
 * close where the node briefly lingers mid exit-animation.
 */
export async function expectSearchDialogDismissed(page: Page) {
  await expect(page.getByTestId('search-dialog')).toBeHidden({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

export type SearchParams = {
  query: string;
  query_label: string;
  query_type: 'text' | 'taxonomy';
};

export async function performSearch(page: Page, params: SearchParams) {
  const searchInput = await openSearchDialog(page);

  if (params.query_type === 'taxonomy') {
    await searchInput.fill(params.query_label ?? params.query);

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    const optionCount = await options.count();
    if (optionCount === 0) {
      throw new Error('No taxonomy options were returned from autocomplete');
    }

    const taxonomyPrefix = params.query.split('.')[0];
    const exactCodeOption = options.filter({ hasText: params.query });
    const prefixCodeOption = options.filter({ hasText: taxonomyPrefix });
    const taxonomyLikeOption = options.filter({ hasText: /[A-Z]{2}-\d{4}/ });

    if ((await exactCodeOption.count()) > 0) {
      await exactCodeOption.first().click();
    } else if ((await prefixCodeOption.count()) > 0) {
      await prefixCodeOption.first().click();
    } else if ((await taxonomyLikeOption.count()) > 0) {
      await taxonomyLikeOption.first().click();
    } else {
      await options.first().click();
    }
  } else {
    await searchInput.fill(params.query ?? '');
  }

  const submitButton = page.getByTestId('search-submit-btn');
  await expect(submitButton).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });

  // Start URL assertion in parallel with submit so the navigation is not missed
  // (sequential click → expect can leave the main frame on a bad URL in fast/slow-hybrid UIs).
  await Promise.all([
    expectPageUrl(page, isSearchResultsListUrl),
    submitButton.click(),
  ]);
  await expectSearchDialogDismissed(page);
  await expect(page.locator('#search-container')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/**
 * Runs `performSearch` and returns the first result's link locator + trimmed
 * name. Centralizes the "search → wait for `#search-container` → grab the
 * first `resource-link`" sequence repeated across favorites specs.
 */
export async function searchAndGetFirstResult(
  page: Page,
  params: SearchParams,
) {
  await performSearch(page, params);

  await page
    .locator('#search-container')
    .waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });

  const link = page.getByTestId('resource-link').first();
  await expect(link).toBeVisible({ timeout: SEARCH_NAV_TIMEOUT_MS });
  const name = ((await link.textContent()) ?? '').trim();

  return { link, name };
}

export async function getResultTotal(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await resultTotal.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
  return (await resultTotal.textContent()) ?? '';
}

export async function getResultTotalNumber(page: Page): Promise<number> {
  // Ensure results container is visible first
  await expect(page.locator('#search-container')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  const resultTotal = page.locator('#result-total');
  await expect(resultTotal).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

  // Wait for at least one result link to be visible (ensures results are rendered)
  const resultLinks = page.getByTestId('resource-link');
  await expect(resultLinks.first()).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  // Poll until the parsed total settles to a stable, non-zero value. Callers
  // compare this number across language switches / filter changes, so a value
  // read mid-update would flake. Two consecutive equal (>0) reads = settled.
  // (Replaces a fixed `waitForTimeout(100)` DOM-settle sleep.)
  let previous = Number.NaN;
  await expect
    .poll(
      async () => {
        const current = parseTrailingInteger(
          (await resultTotal.textContent()) ?? '',
        );
        const stable = current > 0 && current === previous;
        previous = current;
        return stable;
      },
      { timeout: ASYNC_UI_TIMEOUT_MS, intervals: [100, 200, 400, 800] },
    )
    .toBe(true);

  return previous;
}

export async function getResultTotalText(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await expect(resultTotal).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  return ((await resultTotal.textContent()) ?? '').trim();
}

export async function getResultTitles(
  page: Page,
  limit = 10,
): Promise<string[]> {
  const links = page.getByTestId('resource-link');
  await expect(links.first()).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  const count = await links.count();
  const capped = Math.min(count, limit);
  const titles: string[] = [];

  for (let i = 0; i < capped; i += 1) {
    const title = ((await links.nth(i).textContent()) ?? '').trim();
    if (title) titles.push(title);
  }

  return titles;
}

/** Matches topic links with or without trailing slash before `?` (Next trailingSlash). */
const topicSearchLinkSel = 'a[href*="/search"][href*="query="]';
export async function openTopicSearch(page: Page) {
  const directTopicLinks = page.locator(topicSearchLinkSel);
  if ((await directTopicLinks.count()) === 0) {
    const topicsLink = page
      .locator('a[href$="/topics"], a[href*="/topics?"]')
      .first();
    await expect(topicsLink).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await topicsLink.click();
    await expectPageUrl(page, /topics\/?(?:\?|$)/);
    await expect(directTopicLinks.first()).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  }

  const maxTries = 10;
  const linksCount = await page.locator(topicSearchLinkSel).count();
  const tries = Math.min(maxTries, linksCount);

  for (let i = 0; i < tries; i += 1) {
    const topicLink = page.locator(topicSearchLinkSel).nth(i);
    await expect(topicLink).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await topicLink.click();
    await expectPageUrl(page, isSearchResultsListUrl);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    return;
  }

  throw new Error('No topic search link found.');
}

/**
 * County (and other) facets stay disabled until the user sets a place—same as
 * the “Add my location” product rule. Fills a stable test city and submits
 * from the search dialog so the filter panel can be exercised.
 */
export async function applyTestLocationOnSearchPage(page: Page) {
  const addOrChange = page.getByRole('button', {
    name: /add my location|change location|cambiar ubicación|agregar mi ubicación/i,
  });
  await expect(addOrChange.first()).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await addOrChange.first().click();
  const locationInput = page.locator('#location-input');
  await expect(locationInput).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await locationInput.fill('minneapolis');
  const listbox = page.getByTestId('autocomplete-listbox');
  await listbox.waitFor({ state: 'visible', timeout: AUTOCOMPLETE_TIMEOUT_MS });
  await locationInput.press('Enter');
  await expect(page.locator('#search-container')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await waitForFilterPanelInteractive(page);
}
