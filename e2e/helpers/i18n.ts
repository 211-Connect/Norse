import { type Page, expect } from '@playwright/test';

import { SEARCH_NAV_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from '../timeouts';
import { LOCALE } from './navigation';
import { toSingleRegexLiteral } from './url';

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
