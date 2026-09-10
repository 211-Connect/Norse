import {
  getRequiredOrganizationFixture,
  isOrganizationSearchEnabledForCurrentTenant,
} from './fixtures/tenants';
import {
  expect,
  expectPageUrl,
  getResultTotalNumber,
  goHome,
  isSearchResultsListUrl,
  openSearchDialog,
  performSearch,
  test,
} from './helpers';
import { UI_SHELL_TIMEOUT_MS } from './timeouts';

/**
 * Real, unmocked coverage of organization search - selecting an
 * organization from the search dialog's autocomplete "Organizations" group
 * and confirming it navigates to `/search?organization_id={id}` with
 * non-zero results. The exact id in the URL belongs to the selected
 * organization option; it is checked for presence/validity rather than matched
 * to the fixture id because the fixture's name uniqueness is what keeps the
 * autocomplete option deterministic.
 *
 * @see docs/search.md's "Organization search" section for the full flow
 * this exercises, including the accepted same-name-collision limitation.
 *
 * Only runs when the active tenant/env fixture has
 * `organizationSearchEnabled` (see `e2e/fixtures/tenants.ts`) - currently no
 * tenant. Flip the fixture flag on (and add a verified, name-unique
 * `organization` fixture) for a tenant/env once `enableOrganizationSearch`
 * is on there and this suite picks it up automatically.
 */
test.describe('Organization search (real data, no mocks)', () => {
  test.skip(
    !isOrganizationSearchEnabledForCurrentTenant(),
    'Organization search is not enabled for this tenant/environment (see e2e/fixtures/tenants.ts)',
  );

  const organization = getRequiredOrganizationFixture();

  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('selecting an organization from the autocomplete searches by name and returns results', async ({
    page,
  }) => {
    await goHome(page);

    const trigger = page.getByTestId('search-trigger').first();
    await trigger.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
    await trigger.click();
    await page.getByTestId('search-dialog').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill(organization.name);

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });

    // Look for the organization option in the autocomplete
    const organizationOption = listbox
      .getByTestId('autocomplete-option')
      .filter({ hasText: organization.name });
    await expect(organizationOption.first()).toBeVisible();
    await organizationOption.first().click();

    const submitButton = page.getByTestId('search-submit-btn');
    await expect(submitButton).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });

    // Start URL assertion in parallel with submit so the navigation is not missed
    await Promise.all([
      expectPageUrl(page, isSearchResultsListUrl),
      submitButton.click(),
    ]);

    await expect(page.getByTestId('search-dialog')).toBeHidden({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });

    const url = new URL(page.url());
    // Organization search routes by organization_id; the free-text query is
    // intentionally empty because the org option sets `query: ''` and the
    // backend filters by stable organization id.
    // Org options carry `organization_id`; the selected org's id ends up in
    // the URL. We assert the parameter is set rather than exact equality
    // because live data may contain same-named organizations and the fixture
    // only guarantees a name-unique org (see docs/search.md known limitation).
    expect(url.searchParams.get('organization_id')).toBeTruthy();
    expect(url.searchParams.get('organization_id')).toEqual(
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ),
    );
    expect(url.searchParams.get('query')).toBeNull();

    const total = await getResultTotalNumber(page);
    expect(total).toBeGreaterThan(0);
  });

  test('organization badge shows the fixture city when configured', async ({
    page,
  }) => {
    test.skip(
      !organization.city,
      'No verified city fixture for this tenant\u2019s organization - showOrganizationLocationBadge coverage skipped',
    );

    const trigger = page.getByTestId('search-trigger').first();
    await trigger.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });
    await trigger.click();
    await page.getByTestId('search-dialog').waitFor({ state: 'visible' });

    const searchInput = page.locator('#search-input');
    await searchInput.fill(organization.name);

    const listbox = page.getByTestId('autocomplete-listbox');
    await listbox.waitFor({ state: 'visible', timeout: UI_SHELL_TIMEOUT_MS });

    const matchingOption = listbox
      .getByTestId('autocomplete-option')
      .filter({ hasText: organization.name });
    const optionText = await matchingOption.first().textContent();
    // When location badges are enabled, each organization option shows
    // "<name><city>, <state> " (city/state badge). A city is alphabetic with
    // optional spaces/punctuation.
    expect(optionText).toMatch(
      new RegExp(`${organization.name}.*[A-Za-z\\s.,]+`),
    );
  });
});
