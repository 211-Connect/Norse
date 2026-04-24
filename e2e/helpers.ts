import { test as base, expect, type Page } from '@playwright/test';
import { baseURL } from '../playwright.config';
import {
  AUTH_NAV_TIMEOUT_MS,
  AUTOCOMPLETE_TIMEOUT_MS,
  PAGE_LOAD_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

export const LOCALE = 'en';

/**
 * True when the URL is the search **results list** (has query string), not a
 * resource detail route (`/search/{id}`). Uses pathname segments so it works
 * with any host, `basePath` (`NEXT_PUBLIC_CUSTOM_BASE_PATH`), locale prefixes,
 * and `trailingSlash` (`…/search/?query=` vs `…/search?query=`) — see
 * `next.config.js`.
 */
export function isSearchResultsListUrl(url: URL): boolean {
  const segments = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  return (
    segments.length > 0 &&
    segments.at(-1) === 'search' &&
    url.search.length > 0
  );
}

/**
 * Use instead of `waitForURL` for in-app routes: resolves if the page is
 * already on a matching URL, and does not depend on a specific readystate.
 */
export async function expectPageUrl(
  page: Page,
  url: string | RegExp | ((url: URL) => boolean),
  options?: { timeout?: number },
) {
  await expect(page).toHaveURL(url, {
    timeout: options?.timeout ?? SEARCH_NAV_TIMEOUT_MS,
  });
}

function isAuthHost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return host === 'auth.c211.io' || host.includes('keycloak');
  } catch {
    return false;
  }
}

export async function goHome(page: Page) {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL(LOCALE, base).href;
  await page.goto(url, {
    timeout: PAGE_LOAD_TIMEOUT_MS,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('networkidle', { timeout: PAGE_LOAD_TIMEOUT_MS });
}

/**
 * Filter checkboxes are `disabled` while a search navigation is in-flight
 * (`isPending` in filter-panel). Wait until the panel is interactive.
 */
export async function waitForFilterPanelInteractive(page: Page) {
  const first = page.locator('#filter-panel [role="checkbox"]').first();
  await expect(first).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });
}

/**
 * Opens the search dialog and waits until the trigger’s aria-expanded and the
 * dialog match an open modal (same contract as the app’s a11y wiring).
 */
export async function openSearchDialog(page: Page) {
  const trigger = page.getByTestId('search-trigger').first();
  await trigger.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await page.getByTestId('search-dialog').waitFor({ state: 'visible' });
  return page.locator('#search-input');
}

/**
 * After submit navigates to /search, the dialog must be dismissed: trigger
 * collapsed and dialog closed - assert `aria-hidden` (see SearchDialog).
 */
export async function expectSearchDialogDismissed(page: Page) {
  const trigger = page.getByTestId('search-trigger').first();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await expect(page.getByTestId('search-dialog')).toHaveAttribute(
    'aria-hidden',
    'true',
    { timeout: UI_SHELL_TIMEOUT_MS },
  );
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
    await listbox.waitFor({ state: 'visible', timeout: AUTOCOMPLETE_TIMEOUT_MS });

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

  // Start URL assertion in parallel with submit so the navigation is not missed
  // (sequential click → expect can leave the main frame on a bad URL in fast/slow-hybrid UIs).
  await Promise.all([
    expectPageUrl(page, isSearchResultsListUrl),
    page.getByTestId('search-submit-btn').click(),
  ]);
  await expectSearchDialogDismissed(page);
  await expect(page.locator('#search-container')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

export async function goToFavorites(page: Page) {
  // Race navigation with the click so fast client transitions are not missed
  // (same pattern as performSearch).
  await Promise.all([
    page.waitForURL((url) => url.pathname.includes('/favorites'), {
      timeout: SEARCH_NAV_TIMEOUT_MS,
    }),
    page.getByTestId('favorites-btn').click(),
  ]);
  await page.waitForLoadState('networkidle');
}

export async function waitForFavoriteListPage(page: Page) {
  await expectPageUrl(page, /favorites\/[a-f0-9-]{24}/);
  await page
    .getByTestId('back-to-favorites')
    .waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
}

/**
 * Deletes all favorite lists whose names start with "E2E Test List".
 * Loops until no more matching cards are found on the favorites page,
 * clearing out accumulated lists from previous failed test runs.
 */
export async function deleteAllE2ETestLists(page: Page): Promise<void> {
  await goToFavorites(page);

  for (;;) {
    await page.waitForLoadState('networkidle');

    const card = page.getByText(/^E2E Test List /).first();
    const isVisible = await card.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) break;

    await card.click();
    await waitForFavoriteListPage(page);

    const deleteListBtn = page.getByTestId('delete-list-btn');
    await deleteListBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await deleteListBtn.click();

    const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
    await deleteListConfirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await deleteListConfirmBtn.click();

    await expectPageUrl(page, /favorites\/?(?:\?|$)/);
  }
}

/**
 * Deletes all favorite lists whose names start with "E2E Test List".
 * Loops until no more matching cards are found on the favorites page,
 * clearing out accumulated lists from previous failed test runs.
 */
export async function deleteAllE2ETestLists(page: Page): Promise<void> {
  await goToFavorites(page);

  for (;;) {
    await page.waitForLoadState('networkidle');

    const card = page.getByText(/^E2E Test List /).first();
    const isVisible = await card.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) break;

    await card.click();
    await waitForFavoriteListPage(page);

    const deleteListBtn = page.getByTestId('delete-list-btn');
    await deleteListBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await deleteListBtn.click();

    const deleteListConfirmBtn = page.getByTestId('delete-list-confirm-btn');
    await deleteListConfirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await deleteListConfirmBtn.click();

    await page.waitForURL(/favorites\/?(?:\?|$)/, { timeout: 15_000 });
  }
}

export async function getResultTotal(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await resultTotal.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
  return (await resultTotal.textContent()) ?? '';
}

export function parseTrailingInteger(text: string): number {
  const match = text.replace(/,/g, '').match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

export async function getResultTotalNumber(page: Page): Promise<number> {
  const resultTotal = page.locator('#result-total');
  await expect(resultTotal).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  const raw = (await resultTotal.textContent()) ?? '';
  return parseTrailingInteger(raw);
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
    await page.waitForLoadState('networkidle');
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
    await page.waitForLoadState('networkidle');

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
  await expect(addOrChange.first()).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
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
  await page.waitForLoadState('networkidle');
  await waitForFilterPanelInteractive(page);
}

export type AppliedFilter = {
  id: string;
  expectedCount: number;
  actualCount: number;
};

function escapeCssAttributeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getFilterCheckboxById(page: Page, filterId: string) {
  const escaped = escapeCssAttributeValue(filterId);
  return page
    .locator(
      `#filter-panel [role="checkbox"][aria-label="${escaped}"], #filter-panel [role="checkbox"][id="${escaped}"]`,
    )
    .first();
}

export async function getSelectedFilterIds(page: Page): Promise<string[]> {
  const selected = page.locator(
    '#filter-panel [role="checkbox"][data-state="checked"]',
  );
  const count = await selected.count();
  const ids: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const checkbox = selected.nth(i);
    // Prefer `id` so values stay consistent across EN ↔ ES (labels can change; ids usually do not)
    const filterId =
      (await checkbox.getAttribute('id')) ??
      (await checkbox.getAttribute('aria-label')) ??
      '';
    if (filterId) ids.push(filterId);
  }

  return ids.sort();
}

export async function markFiltersByIds(page: Page, filterIds: string[]) {
  const panel = page.locator('#filter-panel');
  await expect(panel).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

  for (const filterId of filterIds) {
    const checkbox = getFilterCheckboxById(page, filterId);
    await expect(checkbox).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    if ((await checkbox.getAttribute('data-state')) !== 'checked') {
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.click();
      await expect(checkbox).toHaveAttribute('data-state', 'checked', {
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    }
  }
}

/**
 * Checks up to `count` **enabled, unchecked** filter checkboxes in panel order
 * (skips disabled / greyed options). Use when fixed filter labels are not
 * reliable across environments.
 */
export async function markFirstNEnabledFilters(
  page: Page,
  count: number,
): Promise<void> {
  const panel = page.locator('#filter-panel');
  await expect(panel).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await waitForFilterPanelInteractive(page);
  let applied = 0;

  // Re-query the checkbox list after each successful apply: the panel re-renders
  // and the node count / order can change, so a single upfront `count()` + `nth(i)`
  // can point past the end (e.g. nth(41) after the list shrinks).
  while (applied < count) {
    const checkboxes = panel.locator('[role="checkbox"]');
    const n = await checkboxes.count();
    if (n === 0) {
      break;
    }

    let progressed = false;
    for (let i = 0; i < n; i += 1) {
      const checkbox = checkboxes.nth(i);
      if (!(await checkbox.isVisible().catch(() => false))) {
        continue;
      }
      if ((await checkbox.getAttribute('data-disabled')) !== null) {
        continue;
      }
      if ((await checkbox.getAttribute('aria-disabled')) === 'true') {
        continue;
      }
      if (await checkbox.isDisabled().catch(() => true)) {
        continue;
      }
      if ((await checkbox.getAttribute('data-state')) === 'checked') {
        continue;
      }
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.click();
      // A no-op click (e.g. still-disabled until location/geo rules resolve) should not burn UI_SHELL_TIMEOUT_MS
      let toggled: boolean;
      try {
        await expect(checkbox).toHaveAttribute('data-state', 'checked', {
          timeout: UI_SHELL_TIMEOUT_MS,
        });
        toggled = true;
      } catch {
        toggled = false;
      }
      if (!toggled) {
        continue;
      }
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      applied += 1;
      progressed = true;
      break;
    }

    if (!progressed) {
      break;
    }
  }

  if (applied < 1) {
    throw new Error(
      'No applicable filter checkboxes: all candidates were disabled or already checked.',
    );
  }
}

function toSingleRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getCheckedFilterDisplayedCount(
  page: Page,
  filterId: string,
): Promise<number> {
  const checkbox = page.locator(
    `#filter-panel [role="checkbox"][aria-label="${filterId}"]`,
  );
  await expect(checkbox).toHaveAttribute('data-state', 'checked', {
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  const row = checkbox.locator(
    'xpath=ancestor::div[contains(@class,"items-center") and contains(@class,"justify-between")][1]',
  );
  const rowText = ((await row.textContent()) ?? '').trim();
  return parseTrailingInteger(rowText);
}

export async function switchLanguage(page: Page, locale: 'en' | 'es') {
  const previousPathname = new URL(page.url()).pathname;

  // Header is the only place with a language Select; search comboboxes are portaled / in main.
  // Do not match on English "language" — the aria-label is translated (e.g. Spanish uses "idioma").
  const languageSelect = page.locator('#app-header').getByRole('combobox');
  await expect(languageSelect).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await languageSelect.click();

  const option = page.getByRole('option', {
    name: new RegExp(`${toSingleRegexLiteral(locale)}\\)$`, 'i'),
  });
  await expect(option).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await option.click();

  await expect(page).toHaveURL(
    (u) => {
      const pathname = u.pathname;
      const escapedLocale = toSingleRegexLiteral(locale);
      // Check if locale appears as a complete path segment (handles base paths)
      const hasExplicitLocale = new RegExp(
        `(?:^|/)${escapedLocale}(?:/|$)`,
      ).test(pathname);

      if (locale !== LOCALE) {
        return hasExplicitLocale;
      }

      if (hasExplicitLocale) {
        return true;
      }

      // Remove locale from previous pathname (handles base paths)
      const previousWithoutLocale = previousPathname.replace(
        /\/[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,4})?(?=\/|$)/,
        '',
      );
      const expectedDefaultPath = previousWithoutLocale || '/';
      return pathname === expectedDefaultPath;
    },
    { timeout: SEARCH_NAV_TIMEOUT_MS },
  );
  await page.waitForLoadState('networkidle');
}

export function parseTotalFromResultText(text: string): number {
  const match = text.match(/of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function loginViaKeycloak(page: Page) {
  const identity = process.env.TEST_USER_EMAIL || 'test@c211.io';
  const password = process.env.TEST_USER_PASSWORD || 'test-password';

  await goHome(page);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('favorites-btn').click();
  await page.getByTestId('login-btn').click();

  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: AUTH_NAV_TIMEOUT_MS })
    .catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: AUTH_NAV_TIMEOUT_MS });

  const url = page.url();
  if (isAuthHost(url)) {
    const identityInput = page
      .locator('input[name="username"], #username')
      .first();
    await identityInput.waitFor({ state: 'visible', timeout: 15_000 });
    await identityInput.fill(identity);

    const passwordInput = page
      .locator('input[name="password"], #password, input[type="password"]')
      .first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordInput.fill(password);

    await Promise.all([
      page.waitForURL((url) => !isAuthHost(url.href), {
        timeout: AUTH_NAV_TIMEOUT_MS,
        waitUntil: 'domcontentloaded',
      }),
      page.locator('#kc-login').click(),
    ]);
    await page.waitForLoadState('networkidle', { timeout: AUTH_NAV_TIMEOUT_MS });
  }
}

export { base as test, expect };
