import { test as base, expect, type Page } from '@playwright/test';

export const LOCALE = 'en';

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
  await page.goto(`/${LOCALE}`);
  await page.waitForLoadState('networkidle');
}

export async function openSearchDialog(page: Page) {
  await page.getByTestId('search-trigger').first().click();
  await page.getByTestId('search-dialog').waitFor({ state: 'visible' });
  return page.locator('#search-input');
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
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });

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

  await page.getByTestId('search-submit-btn').click();

  await page.waitForURL(/\/search\?/);
  await page.waitForLoadState('networkidle');
}

export async function goToFavorites(page: Page) {
  await page.getByTestId('my-stuff-btn').click();
  await page.getByTestId('favorites-btn').click();
  await page.waitForLoadState('networkidle');
}

export async function getResultTotal(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await resultTotal.waitFor({ state: 'visible', timeout: 15000 });
  return (await resultTotal.textContent()) ?? '';
}

export function parseTrailingInteger(text: string): number {
  const match = text.replace(/,/g, '').match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

export async function getResultTotalNumber(page: Page): Promise<number> {
  const resultTotal = page.locator('#result-total');
  await expect(resultTotal).toBeVisible({ timeout: 20_000 });
  const raw = (await resultTotal.textContent()) ?? '';
  return parseTrailingInteger(raw);
}

export async function getResultTotalText(page: Page): Promise<string> {
  const resultTotal = page.locator('#result-total');
  await expect(resultTotal).toBeVisible({ timeout: 20_000 });
  return ((await resultTotal.textContent()) ?? '').trim();
}

export async function getResultTitles(
  page: Page,
  limit = 10,
): Promise<string[]> {
  const links = page.getByTestId('resource-link');
  await expect(links.first()).toBeVisible({ timeout: 20_000 });
  const count = await links.count();
  const capped = Math.min(count, limit);
  const titles: string[] = [];

  for (let i = 0; i < capped; i += 1) {
    const title = ((await links.nth(i).textContent()) ?? '').trim();
    if (title) titles.push(title);
  }

  return titles;
}

export async function openTopicSearch(page: Page) {
  const directTopicLinks = page.locator('a[href*="/search?query="]');
  if ((await directTopicLinks.count()) === 0) {
    const topicsLink = page
      .locator('a[href$="/topics"], a[href*="/topics?"]')
      .first();
    await expect(topicsLink).toBeVisible({ timeout: 20_000 });
    await topicsLink.click();
    await page.waitForURL(/\/topics(\?|$)/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
  }

  const maxTries = 10;
  const linksCount = await page.locator('a[href*="/search?query="]').count();
  const tries = Math.min(maxTries, linksCount);

  for (let i = 0; i < tries; i += 1) {
    const topicLink = page.locator('a[href*="/search?query="]').nth(i);
    await expect(topicLink).toBeVisible({ timeout: 20_000 });
    await topicLink.click();

    await page.waitForURL(/\/search\?/, { timeout: 20_000 });
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: 20_000,
    });

    return;
  }

  throw new Error('No topic search link found.');
}

export type AppliedFilter = {
  id: string;
  expectedCount: number;
  actualCount: number;
};

export async function getSelectedFilterIds(page: Page): Promise<string[]> {
  const selected = page.locator(
    '#filter-panel [role="checkbox"][data-state="checked"]',
  );
  const count = await selected.count();
  const ids: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const ariaLabel = await selected.nth(i).getAttribute('aria-label');
    if (ariaLabel) ids.push(ariaLabel);
  }

  return ids.sort();
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
    timeout: 20_000,
  });

  const row = checkbox.locator(
    'xpath=ancestor::div[contains(@class,"items-center") and contains(@class,"justify-between")][1]',
  );
  const rowText = ((await row.textContent()) ?? '').trim();
  return parseTrailingInteger(rowText);
}

export async function applyFilterWithExpectedDecrease(
  page: Page,
  previousTotal: number,
): Promise<AppliedFilter> {
  const panel = page.locator('#filter-panel');
  await expect(panel).toBeVisible({ timeout: 20_000 });

  const checkboxes = panel.locator('[role="checkbox"]');
  const checkboxCount = await checkboxes.count();
  let firstAttempt: AppliedFilter | null = null;

  for (let i = 0; i < checkboxCount; i += 1) {
    const checkbox = checkboxes.nth(i);

    const state = await checkbox.getAttribute('data-state');
    if (state === 'checked') continue;

    const row = checkbox.locator(
      'xpath=ancestor::div[contains(@class,"items-center") and contains(@class,"justify-between")][1]',
    );
    const rowText = ((await row.textContent()) ?? '').trim();
    const candidateCount = parseTrailingInteger(rowText);
    if (candidateCount <= 0 || candidateCount >= previousTotal) continue;

    const selectedBefore = new Set(await getSelectedFilterIds(page));

    await checkbox.click();
    await page.waitForLoadState('networkidle');

    const selectedAfter = await getSelectedFilterIds(page);
    const newlySelected = selectedAfter.find((id) => !selectedBefore.has(id));
    if (!newlySelected) continue;

    const expectedCount = await getCheckedFilterDisplayedCount(
      page,
      newlySelected,
    );
    const actualCount = await getResultTotalNumber(page);
    const attempt = {
      id: newlySelected,
      expectedCount,
      actualCount,
    };

    if (actualCount < previousTotal) {
      return attempt;
    }

    if (!firstAttempt) {
      firstAttempt = attempt;
    }

    const selectedCheckbox = page.locator(
      `#filter-panel [role="checkbox"][aria-label="${newlySelected}"]`,
    );
    await selectedCheckbox.click();
    await page.waitForLoadState('networkidle');
  }

  if (firstAttempt) {
    return firstAttempt;
  }

  throw new Error(`No applicable filter was found for total ${previousTotal}.`);
}

export async function switchLanguage(page: Page, locale: 'en' | 'es') {
  const previousPathname = new URL(page.url()).pathname;

  const languageSelect = page
    .locator('button[aria-label][role="combobox"]')
    .first();
  await expect(languageSelect).toBeVisible({ timeout: 20_000 });
  await languageSelect.click();

  const option = page.getByRole('option', {
    name: new RegExp(`${toSingleRegexLiteral(locale)}\\)$`, 'i'),
  });
  await expect(option).toBeVisible({ timeout: 20_000 });
  await option.click();

  await page.waitForURL(
    (url) => {
      const pathname = url.pathname;
      const escapedLocale = toSingleRegexLiteral(locale);
      const hasExplicitLocale = new RegExp(`^/${escapedLocale}(?:/|$)`).test(
        pathname,
      );

      if (locale !== LOCALE) {
        return hasExplicitLocale;
      }

      if (hasExplicitLocale) {
        return true;
      }

      const previousWithoutLocale = previousPathname.replace(
        /^\/[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,4})?(?=\/|$)/,
        '',
      );
      const expectedDefaultPath = previousWithoutLocale || '/';
      return pathname === expectedDefaultPath;
    },
    { timeout: 20_000 },
  );
  await page.waitForLoadState('networkidle');
}

export function parseTotalFromResultText(text: string): number {
  const match = text.match(/of\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export async function loginViaKeycloak(page: Page) {
  const identity =
    process.env.TEST_USER_EMAIL ||
    process.env.TEST_USER_USERNAME ||
    'test-user';
  const password = process.env.TEST_USER_PASSWORD || 'test-password';

  await goHome(page);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('my-stuff-btn').click();
  await page.getByTestId('favorites-btn').click();
  await page.getByTestId('login-btn').click();

  await page
    .waitForURL(/auth\.c211\.io|keycloak/i, { timeout: 60_000 })
    .catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 60_000 });

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
      page.waitForURL((url) => !isAuthHost(url.href), { timeout: 60_000 }),
      page.locator('#kc-login').click(),
    ]);
    await page.waitForLoadState('networkidle', { timeout: 60_000 });
  }
}

export { base as test, expect };
