import { baseURL } from '../playwright.config';
import { getDirectResourceIdForCurrentTenant } from './fixtures/tenants';
import {
  expect,
  expectPageUrl,
  isSearchResourceDetailUrl,
  test,
  waitForPageStabilized,
} from './helpers';
import { PAGE_LOAD_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Covers opening a resource detail page straight from its URL - e.g. a
 * bookmark, an external link, or a URL typed/pasted directly - as opposed to
 * reaching it by searching first (see `search-taxonomy.spec.ts`'s "Search
 * result navigation feedback") or via a shortened `/share/{code}` link (see
 * `share-link.spec.ts`). No search flow runs beforehand; the resource route
 * must render correctly on a cold navigation, in both English and Spanish.
 *
 * `directResourceId` (`e2e/fixtures/tenants.ts`) is a real, live resource id
 * per tenant, gathered from real dev-environment URLs - not mocked. Tenants
 * without a verified id yet cause this suite to skip, not fail.
 */
function buildResourceDetailUrl(locale: 'en' | 'es', resourceId: string) {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  return new URL(`${locale}/search/${resourceId}`, base).href;
}

test.describe('Direct resource URL access', () => {
  const resourceId = getDirectResourceIdForCurrentTenant();

  test.skip(
    !resourceId,
    'This tenant has no known direct-resource-link fixture yet (see e2e/fixtures/tenants.ts)',
  );

  for (const locale of ['en', 'es'] as const) {
    test(`opening a resource URL directly renders that resource (${locale})`, async ({
      page,
    }) => {
      const url = buildResourceDetailUrl(locale, resourceId!);

      await page.goto(url, {
        timeout: PAGE_LOAD_TIMEOUT_MS,
        waitUntil: 'domcontentloaded',
      });
      await waitForPageStabilized(page);

      await expectPageUrl(page, isSearchResourceDetailUrl);
      expect(page.url()).toContain(resourceId);

      await expect(page.getByTestId('favorite-btn').first()).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });
  }
});
