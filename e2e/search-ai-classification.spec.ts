import { type Locator, type Page, expect } from '@playwright/test';

import {
  getCurrentTenant,
  getRequiredAiScenarioQueries,
  isAiSearchEnabledForCurrentTenant,
} from './fixtures/tenants';
import { getResultTotalNumber, goHome, test } from './helpers';
import {
  ASYNC_UI_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

/**
 * Real, unmocked coverage of the AI classification search flow (Decision
 * Table A/B/C/D) against a live AI-enabled tenant/environment.
 *
 * @see docs/ai-search-legacy-link-flow.md for the full flow this exercises.
 *
 * Only runs when the active tenant/env fixture has `aiSearchEnabled` (see
 * `e2e/fixtures/tenants.ts`) - currently WA dev only. WA prod and all other
 * tenants self-skip here; flip the fixture flag on for a tenant/env once AI
 * search is enabled there and this suite picks it up automatically.
 *
 * Cases B/D depend on what the live classifier decides for a given query, so
 * this suite uses `tenant.aiScenarioQueries` - real queries hand-verified to
 * deterministically trigger a specific `AiClassificationScenario` - instead
 * of a single ambiguous `broadQuery` plus branching/self-skipping
 * assertions. There is no `test.skip` in this file for scenario ambiguity:
 * if a query stops triggering the scenario it was picked for (e.g. the
 * classifier model changes), the relevant test should fail loudly rather
 * than silently skip - add a newly-verified query to the fixture instead of
 * reintroducing branching here.
 */

function buildAiSearchUrl(
  baseURL: string,
  params: Record<string, string>,
): string {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL('en/search', base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

/** Canonical direct-search outcome: `query_type=hybrid` with a resolved `taxonomy`. */
function isCanonicalAiUrl(pageUrl: string): boolean {
  const url = new URL(pageUrl);
  return (
    url.searchParams.get('query_type') === 'hybrid' &&
    !!url.searchParams.get('taxonomy')
  );
}

/** Skip-fallback outcome: hybrid query type, but no taxonomy was resolved/applied. */
function isSkipFallbackUrl(pageUrl: string): boolean {
  const url = new URL(pageUrl);
  return (
    url.searchParams.get('query_type') === 'hybrid' &&
    !url.searchParams.get('taxonomy') &&
    url.searchParams.get('sllc') === '1'
  );
}

async function waitForCanonicalAiUrl(page: Page) {
  await expect
    .poll(() => isCanonicalAiUrl(page.url()), {
      timeout: ASYNC_UI_TIMEOUT_MS,
      intervals: [250, 500, 1_000],
    })
    .toBe(true);
}

function isHybridAlertUrl(pageUrl: string, alert: string): boolean {
  const url = new URL(pageUrl);
  return (
    url.searchParams.get('query_type') === 'hybrid' &&
    url.searchParams.get('a') === alert
  );
}

async function waitForHybridAlertUrl(page: Page, alert: string) {
  await expect
    .poll(() => isHybridAlertUrl(page.url(), alert), {
      timeout: ASYNC_UI_TIMEOUT_MS,
      intervals: [250, 500, 1_000],
    })
    .toBe(true);
}

/**
 * Returns a locator pinned to the first currently-unselected option button,
 * by index rather than by `pressed: false`. Filtering by `pressed` and
 * reusing that same locator after clicking is a bug: the locator is a live
 * query, so once the click flips that button's `aria-pressed` to `true`, the
 * `pressed: false` filter re-resolves to a *different* (still-unselected)
 * button on the next query, not the one that was just clicked - making a
 * follow-up `toHaveAttribute('aria-pressed', 'true')` assertion on it
 * impossible to satisfy. Button DOM order is stable across toggles, so a
 * positional `.nth(index)` locator is used instead.
 */
async function getFirstUnselectedOption(optionsContainer: Locator) {
  const allOptions = optionsContainer.getByRole('button');
  await expect(allOptions.first()).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  const count = await allOptions.count();
  for (let i = 0; i < count; i++) {
    const pressed = await allOptions.nth(i).getAttribute('aria-pressed');
    if (pressed === 'false') {
      return allOptions.nth(i);
    }
  }
  throw new Error('No unselected AI classification option button found.');
}

test.describe('AI classification search flow (real data, no mocks)', () => {
  test.skip(
    !isAiSearchEnabledForCurrentTenant(),
    'AI classification search is not enabled for this tenant/environment (see e2e/fixtures/tenants.ts)',
  );

  const tenant = getCurrentTenant();
  const aiScenarioQueries = getRequiredAiScenarioQueries();

  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('Case A: hybrid query with taxonomy searches directly without opening AI clarification', async ({
    page,
    baseURL,
  }) => {
    const url = buildAiSearchUrl(baseURL!, {
      query: tenant.taxonomy.code,
      query_label: tenant.taxonomy.label,
      query_type: 'hybrid',
      taxonomy: tenant.taxonomy.code,
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('ai-classification-options')).toHaveCount(0);

    expect(await getResultTotalNumber(page)).toBeGreaterThan(10);
  });

  test('Case C: taxonomy query type searches directly without opening AI clarification', async ({
    page,
    baseURL,
  }) => {
    const url = buildAiSearchUrl(baseURL!, {
      query: tenant.taxonomy.code,
      query_label: tenant.taxonomy.label,
      query_type: 'taxonomy',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('ai-classification-options')).toHaveCount(0);
  });

  test('Case B/D "search" scenario: legacy query redirects immediately to the canonical hybrid+taxonomy URL with no notice banner', async ({
    page,
    baseURL,
  }) => {
    const url = buildAiSearchUrl(baseURL!, {
      query: aiScenarioQueries.direct,
      query_label: aiScenarioQueries.direct,
      query_type: 'text',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForCanonicalAiUrl(page);

    expect(new URL(page.url()).searchParams.get('a')).toBeNull();
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await expect(page.getByTestId('ai-classification-options')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('Case B/D "search_and_notify_low_info" scenario with results: redirects to the canonical URL, shows the notice banner, and returns results', async ({
    page,
    baseURL,
  }) => {
    const url = buildAiSearchUrl(baseURL!, {
      query: aiScenarioQueries.lowInfoWithResults,
      query_label: aiScenarioQueries.lowInfoWithResults,
      query_type: 'text',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForHybridAlertUrl(page, 'low_info');

    await expect(page.getByRole('alert')).toContainText(/broader results/i, {
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    expect(await getResultTotalNumber(page)).toBeGreaterThan(0);
  });

  test('Case B/D clarify scenario: legacy query opens the AI clarification UI instead of redirecting', async ({
    page,
    baseURL,
  }) => {
    const url = buildAiSearchUrl(baseURL!, {
      query: aiScenarioQueries.clarify,
      query_label: aiScenarioQueries.clarify,
      query_type: 'text',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('search-dialog')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
    await expect(page.getByTestId('ai-classification-options')).toBeVisible({
      timeout: ASYNC_UI_TIMEOUT_MS,
    });
    expect(isCanonicalAiUrl(page.url())).toBe(false);
  });

  test.describe('AI clarification interaction', () => {
    test.beforeEach(async ({ page, baseURL }) => {
      const url = buildAiSearchUrl(baseURL!, {
        query: aiScenarioQueries.clarify,
        query_label: aiScenarioQueries.clarify,
        query_type: 'text',
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('ai-classification-options')).toBeVisible({
        timeout: ASYNC_UI_TIMEOUT_MS,
      });
    });

    test('accepting the pre-selected options and confirming navigates to the canonical hybrid+taxonomy URL', async ({
      page,
    }) => {
      const optionsContainer = page.getByTestId('ai-classification-options');
      const preSelected = optionsContainer.getByRole('button', {
        pressed: true,
      });
      await expect(preSelected.first()).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      expect(await preSelected.count()).toBeGreaterThan(0);

      await page.getByRole('button', { name: 'Confirm' }).click();

      await waitForCanonicalAiUrl(page);
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    test('modifying the selection and confirming navigates to the canonical hybrid+taxonomy URL', async ({
      page,
    }) => {
      const optionsContainer = page.getByTestId('ai-classification-options');
      const unselectedOption = await getFirstUnselectedOption(optionsContainer);
      await unselectedOption.click();
      await expect(unselectedOption).toHaveAttribute('aria-pressed', 'true');

      await page.getByRole('button', { name: 'Confirm' }).click();

      await waitForCanonicalAiUrl(page);
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    test('skipping without modifying the pre-selected options falls back to a non-canonical search', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Skip' }).click();

      await expect(page.getByTestId('search-dialog')).toBeHidden({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      await expect
        .poll(() => isSkipFallbackUrl(page.url()), {
          timeout: SEARCH_NAV_TIMEOUT_MS,
          intervals: [250, 500, 1_000],
        })
        .toBe(true);
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });

    test('modifying the selection and then skipping still falls back to the same non-canonical search', async ({
      page,
    }) => {
      const optionsContainer = page.getByTestId('ai-classification-options');
      const unselectedOption = await getFirstUnselectedOption(optionsContainer);
      await unselectedOption.click();
      await expect(unselectedOption).toHaveAttribute('aria-pressed', 'true');

      await page.getByRole('button', { name: 'Skip' }).click();

      await expect(page.getByTestId('search-dialog')).toBeHidden({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
      await expect
        .poll(() => isSkipFallbackUrl(page.url()), {
          timeout: SEARCH_NAV_TIMEOUT_MS,
          intervals: [250, 500, 1_000],
        })
        .toBe(true);
      await expect(page.locator('#search-container')).toBeVisible({
        timeout: UI_SHELL_TIMEOUT_MS,
      });
    });
  });
});
