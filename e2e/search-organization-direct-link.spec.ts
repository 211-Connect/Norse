import { baseURL } from '../playwright.config';
import {
  getRequiredOrganizationFixture,
  isOrganizationSearchEnabledForCurrentTenant,
} from './fixtures/tenants';
import {
  expect,
  expectPageUrl,
  isSearchOrganizationResultsUrl,
  test,
  waitForPageStabilized,
} from './helpers';
import { PAGE_LOAD_TIMEOUT_MS, UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Covers opening an organization search results page straight from its URL -
 * e.g. a bookmark, an external link, or a URL typed/paste directly - as
 * opposed to reaching it by searching first (see
 * `search-organization.spec.ts`). No search flow runs beforehand; the
 * organization search route must render correctly on a cold navigation, in
 * both English and Spanish.
 *
 * Organization search URLs follow the pattern
 * `/search?organization_id={id}`, where the id is URL-encoded. The
 * organization fixture (`e2e/fixtures/tenants.ts`) is a real, live
 * organization id/name per tenant, gathered from real dev-environment data -
 * not mocked. Tenants without organization search enabled cause this suite to
 * skip, not fail.
 */

function buildOrganizationSearchUrl(
  locale: 'en' | 'es',
  organizationId: string,
) {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  // The app generates organization search URLs with `organization_id` and an
  // empty `query`. For a cold direct link we can omit the empty query param.
  return new URL(
    `${locale}/search?organization_id=${encodeURIComponent(organizationId)}`,
    base,
  ).href;
}

test.describe('Direct organization search URL access', () => {
  test.skip(
    !isOrganizationSearchEnabledForCurrentTenant(),
    'Organization search is not enabled for this tenant/environment (see e2e/fixtures/tenants.ts)',
  );

  let organization: { id: string; name: string; city?: string };

  test.beforeAll(() => {
    organization = getRequiredOrganizationFixture();
  });

  for (const locale of ['en', 'es'] as const) {
    test(`opening an organization search URL directly renders results (${locale})`, async ({
      page,
    }) => {
      const url = buildOrganizationSearchUrl(locale, organization.id);

      await page.goto(url, {
        timeout: PAGE_LOAD_TIMEOUT_MS,
        waitUntil: 'domcontentloaded',
      });
      await waitForPageStabilized(page);

      await expectPageUrl(page, isSearchOrganizationResultsUrl);

      const urlObj = new URL(page.url());
      expect(urlObj.searchParams.get('organization_id')).toBe(organization.id);
      expect(urlObj.searchParams.get('query')).toBeNull();

      // Expect to see results for this organization
      await expect(page.getByTestId('resource-link').first()).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });

      // Verify there are results by checking for result total
      const resultTotal = page.locator('#result-total');
      await expect(resultTotal).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
      const totalText = await resultTotal.textContent();
      expect(Number(totalText?.match(/\d+/)?.[0] || 0)).toBeGreaterThan(0);
    });
  }
});
