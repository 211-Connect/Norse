import type { Page } from '@playwright/test';

import { baseURL } from '../playwright.config';
import { getCurrentTenant } from './fixtures/tenants';
import {
  expect,
  expectSearchDialogDismissed,
  goHome,
  LOCALE,
  test,
  waitForPageStabilized,
} from './helpers';
import {
  AUTOCOMPLETE_TIMEOUT_MS,
  SEARCH_NAV_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from './timeouts';

/**
 * Regression coverage for the search-dialog location bugs:
 *
 * - The dialog's own client-side navigation used to never include `location`/
 *   `coords` on the `/search` request it triggers (a param-name mismatch
 *   between the search atom and `buildSearchUrl`). This was usually invisible
 *   because `searchLinkCorrectionMiddleware` backfills both from the
 *   `user-pref-location`/`user-pref-coords` cookies on the next request — so
 *   the first test below asserts on the *first* request the dialog itself
 *   fires, not the eventually-settled page URL, which the cookie fallback
 *   could still repair even if the dialog's own URL building were broken
 *   again.
 * - Submitting before the location field's debounced geocode lookup resolves
 *   (type quickly, hit Enter immediately) used to either submit with the
 *   location silently dropped, or — worse, when replacing an already-picked
 *   location — resubmit with the *old* location's coordinates instead of the
 *   newly typed text. `buildSearchUrl` now sends the raw typed `location`
 *   text even without coordinates, exactly like an external deep link with a
 *   location but no coords: the destination `/search` page itself forward-
 *   geocodes it server-side and redirects with `coords` added (see
 *   `navigateToSearchWithCoords`, already covered for deep links by
 *   `search-location-geocode.spec.ts`). These tests exercise the same
 *   mechanism from the dialog instead of a raw deep link.
 *
 * @see src/app/(app)/features/search/hooks/useNavigateClassicSearch.ts
 * @see src/app/(app)/features/search/utils/buildSearchUrl.ts
 * @see src/app/(app)/[locale]/(rest)/search/page.tsx
 * @see src/app/(app)/shared/components/ui/autocomplete.tsx
 * @see src/app/(app)/shared/components/search/location-search-bar.tsx
 */

// A real place within the current tenant's service area (see
// `TenantFixture.testLocation`) - not a single shared city, since a location
// outside a tenant's coverage isn't guaranteed to geocode/behave the same way.
const testLocation = getCurrentTenant().testLocation;

async function openDialogFromSearchTrigger(page: Page) {
  const trigger = page.getByTestId('search-trigger').first();
  await trigger.click();
  const dialog = page.getByTestId('search-dialog');
  await expect(dialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  return dialog;
}

function isSearchRequest(url: string): boolean {
  const pathname = new URL(url).pathname.replace(/\/+$/, '');
  return pathname.endsWith('/search');
}

function buildSeedSearchUrl(params: Record<string, string>): string {
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const url = new URL(`${LOCALE}/search`, base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

function getCoordsParam(pageUrl: string): string | null {
  return new URL(pageUrl).searchParams.get('coords');
}

test.describe('Search dialog location: navigation params + Enter-while-pending', () => {
  test.beforeEach(async ({ context }) => {
    // Start each test without a location cookie so the middleware's cookie
    // fallback can't mask a regression in the dialog's own request.
    await context.clearCookies();
  });

  test('typing in the location field debounces geocode lookups instead of firing one request per keystroke', async ({
    page,
  }) => {
    await goHome(page);
    await openDialogFromSearchTrigger(page);

    const locationInput = page.locator('#location-input');
    await locationInput.click();

    // Geocode lookups are Next.js server actions, which POST to the current
    // page's own URL - a reliable way to count them without depending on an
    // internal endpoint shape.
    const pagePathname = new URL(page.url()).pathname;
    let serverActionRequests = 0;
    const onRequest = (req: { method(): string; url(): string }) => {
      if (
        req.method() === 'POST' &&
        new URL(req.url()).pathname === pagePathname
      ) {
        serverActionRequests += 1;
      }
    };
    page.on('request', onRequest);

    // Type a full city name character-by-character, like a real user -
    // each keystroke used to fire its own immediate geocode request with no
    // debounce at all (see LOCATION_SEARCH_DEBOUNCE_DELAY).
    await locationInput.pressSequentially(testLocation, { delay: 20 });

    // Comfortably under LOCATION_SEARCH_DEBOUNCE_DELAY (500ms) since the
    // last keystroke - a (would-be incorrect) per-keystroke request would
    // already have fired by now.
    await page.waitForTimeout(200);
    expect(serverActionRequests).toBe(0);

    // Once the debounce elapses, exactly one geocode lookup fires for the
    // final typed text.
    await expect
      .poll(() => serverActionRequests, { timeout: AUTOCOMPLETE_TIMEOUT_MS })
      .toBeGreaterThan(0);
    expect(serverActionRequests).toBeLessThanOrEqual(2);
    page.off('request', onRequest);
  });

  test('submitting a resolved location includes location and coords on the request the dialog itself fires', async ({
    page,
  }) => {
    await goHome(page);
    await openDialogFromSearchTrigger(page);

    await page.locator('#search-input').fill('food');

    const locationInput = page.locator('#location-input');
    const listbox = page
      .getByTestId('location-field')
      .getByTestId('autocomplete-listbox');

    await locationInput.fill(testLocation);
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    // Index 0 is always the "Everywhere" placeholder (see useLocations) -
    // wait for a real geocode result after it and pick that one.
    await expect
      .poll(() => options.count(), { timeout: AUTOCOMPLETE_TIMEOUT_MS })
      .toBeGreaterThan(1);
    await options.nth(1).click();

    const [searchRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === 'GET' && isSearchRequest(req.url()),
        { timeout: SEARCH_NAV_TIMEOUT_MS },
      ),
      page.getByTestId('search-submit-btn').click(),
    ]);

    const requestUrl = new URL(searchRequest.url());
    expect(requestUrl.searchParams.get('location')).toBeTruthy();
    expect(requestUrl.searchParams.get('coords')).toBeTruthy();

    await expectSearchDialogDismissed(page);
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('typing a location and pressing Enter immediately still lands on that location, geocoded server-side', async ({
    page,
  }) => {
    await goHome(page);
    await openDialogFromSearchTrigger(page);

    await page.locator('#search-input').fill('food');
    const locationInput = page.locator('#location-input');

    // Deliberately do NOT wait for suggestions to load before pressing Enter
    // - that's the race under test. Whatever the field holds gets submitted
    // as-is, without waiting for a geocode match.
    const [firstSearchRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === 'GET' && isSearchRequest(req.url()),
        { timeout: SEARCH_NAV_TIMEOUT_MS },
      ),
      (async () => {
        await locationInput.fill(testLocation);
        await locationInput.press('Enter');
      })(),
    ]);

    // The very first request the dialog fires must carry the typed location
    // text even though it hasn't been geocoded client-side yet - it must
    // never be silently dropped in favor of an implicit "everywhere" search.
    const firstUrl = new URL(firstSearchRequest.url());
    expect(firstUrl.searchParams.get('location')).toBeTruthy();
    expect(firstUrl.searchParams.get('location')?.toLowerCase()).not.toBe(
      'everywhere',
    );

    await expectSearchDialogDismissed(page);

    // The page settles (via the server-side forward-geocode redirect, same
    // mechanism as an external deep link) on a URL with real coordinates for
    // the typed location.
    await expect
      .poll(() => getCoordsParam(page.url()), {
        timeout: SEARCH_NAV_TIMEOUT_MS,
        intervals: [250, 500, 1_000],
      })
      .not.toBeNull();

    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get('location')).toBeTruthy();
    expect(finalUrl.searchParams.get('location')?.toLowerCase()).not.toBe(
      'everywhere',
    );
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('replacing an already-picked location and submitting immediately uses the new location, not the stale one', async ({
    page,
  }) => {
    // Seed a resolved OLD location directly via URL - a fixed, arbitrary
    // place far from `testLocation` - so this test's starting point doesn't
    // itself depend on a geocode round trip.
    const staleLocation = 'Anchorage, AK';
    const staleCoords = '-149.9,61.2';

    await page.goto(
      buildSeedSearchUrl({
        query: 'food',
        query_label: 'food',
        query_type: 'text',
        location: staleLocation,
        coords: staleCoords,
      }),
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    // The Next.js route-change toploader can still be animating over the
    // header at this point and intercept the click below.
    await waitForPageStabilized(page);

    // The trigger reflects the seeded stale location before we touch anything.
    const changeLocation = page
      .getByRole('button', { name: /change location/i })
      .first();
    await expect(changeLocation).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await changeLocation.click();

    const dialog = page.getByTestId('search-dialog');
    await expect(dialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    const locationInput = page.locator('#location-input');
    await expect(locationInput).toHaveValue(staleLocation);

    // Replace it with a different, real location and submit immediately -
    // without waiting for the new location's own suggestions to load.
    await locationInput.fill(testLocation);
    await Promise.all([
      expect
        .poll(() => getCoordsParam(page.url()), {
          timeout: SEARCH_NAV_TIMEOUT_MS,
          intervals: [250, 500, 1_000],
        })
        .not.toBe(staleCoords),
      locationInput.press('Enter'),
    ]);

    // Coordinates and location must reflect the NEW pick, not the stale one
    // that was still sitting in the atom/cookie a moment before.
    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get('coords')).not.toBe(staleCoords);
    expect(finalUrl.searchParams.get('location')).toBeTruthy();
    expect(finalUrl.searchParams.get('location')?.toLowerCase()).not.toContain(
      'anchorage',
    );
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });

  test('replacing an already-picked location by explicitly selecting a suggestion and clicking Search updates the URL', async ({
    page,
  }) => {
    const staleLocation = 'Anchorage, AK';
    const staleCoords = '-149.9,61.2';

    await page.goto(
      buildSeedSearchUrl({
        query: 'food',
        query_label: 'food',
        query_type: 'text',
        location: staleLocation,
        coords: staleCoords,
      }),
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
    await waitForPageStabilized(page);

    const changeLocation = page
      .getByRole('button', { name: /change location/i })
      .first();
    await expect(changeLocation).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
    await changeLocation.click();

    const dialog = page.getByTestId('search-dialog');
    await expect(dialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

    const locationInput = page.locator('#location-input');
    await expect(locationInput).toHaveValue(staleLocation);

    await locationInput.fill(testLocation);
    const listbox = page
      .getByTestId('location-field')
      .getByTestId('autocomplete-listbox');
    await listbox.waitFor({
      state: 'visible',
      timeout: AUTOCOMPLETE_TIMEOUT_MS,
    });

    const options = listbox.getByTestId('autocomplete-option');
    await expect
      .poll(() => options.count(), { timeout: AUTOCOMPLETE_TIMEOUT_MS })
      .toBeGreaterThan(1);
    await options.nth(1).click();

    await Promise.all([
      expect
        .poll(() => getCoordsParam(page.url()), {
          timeout: SEARCH_NAV_TIMEOUT_MS,
          intervals: [250, 500, 1_000],
        })
        .not.toBe(staleCoords),
      page.getByTestId('search-submit-btn').click(),
    ]);

    await expectSearchDialogDismissed(page);

    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.get('coords')).not.toBe(staleCoords);
    expect(finalUrl.searchParams.get('location')).toBeTruthy();
    expect(finalUrl.searchParams.get('location')?.toLowerCase()).not.toContain(
      'anchorage',
    );
    await expect(page.locator('#search-container')).toBeVisible({
      timeout: UI_SHELL_TIMEOUT_MS,
    });
  });
});
