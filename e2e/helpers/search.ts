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
  toSingleRegexLiteral,
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

    // The listbox becomes visible as soon as the request starts, showing only
    // a loading row (see `isListVisible` in the autocomplete), so a one-shot
    // `count()` here can read 0 mid-fetch. Wait for a resolved option.
    const options = listbox.getByTestId('autocomplete-option');
    await expect(
      options.first(),
      'No taxonomy options were returned from autocomplete',
    ).toBeVisible({ timeout: AUTOCOMPLETE_TIMEOUT_MS });

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

/**
 * Settle point after a search-results navigation (location change, filter
 * toggle, language switch). Waits on the page's own completion signals - the
 * route toploader finishing and the filter panel leaving its `isPending`
 * (disabled) state, which only clears once the new search params commit -
 * instead of `networkidle`. Some tenants' third-party trackers (e.g. Feathr on
 * WA holds `polo.feathr.co/v1/analytics/crumb` requests open for 10s+) mean
 * `networkidle` is reached only by chance there.
 */
export async function waitForSearchResultsSettled(page: Page) {
  await page
    .getByTestId('toploader-bar')
    .waitFor({ state: 'hidden', timeout: SEARCH_NAV_TIMEOUT_MS });
  await expect(page.locator('#search-container')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  // Data-thin tenants/locations can render no facets at all; callers decide
  // whether that's a skip, so only wait on the panel when it has checkboxes.
  const checkboxes = page.locator('#filter-panel [role="checkbox"]');
  if ((await checkboxes.count()) > 0) {
    await waitForFilterPanelInteractive(page);
  }
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
 * the “Add my location” product rule. Fills the given test city and submits
 * from the search dialog so the filter panel can be exercised.
 *
 * `location` must be a real place within the current tenant's actual service
 * area (see `TenantFixture.testLocation` in `fixtures/tenants.ts`) - a
 * location outside a tenant's coverage isn't guaranteed to return the same
 * non-zero result counts other location-gated assertions rely on.
 */
export async function applyTestLocationOnSearchPage(
  page: Page,
  location: string,
) {
  const addOrChange = page.getByRole('button', {
    name: /add my location|change location|cambiar ubicación|agregar mi ubicación/i,
  });
  await expect(addOrChange.first()).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await addOrChange.first().click();
  const locationInput = page.locator('#location-input');
  await expect(locationInput).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await locationInput.fill(location);
  const listbox = page.getByTestId('autocomplete-listbox');
  await listbox.waitFor({ state: 'visible', timeout: AUTOCOMPLETE_TIMEOUT_MS });
  // Listbox visibility alone isn't enough: while the geocode request for
  // `location` is still in flight, the only option shown is the "Everywhere"
  // placeholder (see the autocomplete's isLoading gating), and pressing
  // Enter against just that one option would either no-op or fall back to
  // Everywhere. Wait for a real, resolved suggestion before committing.
  const options = listbox.getByTestId('autocomplete-option');
  await expect
    .poll(() => options.count(), { timeout: AUTOCOMPLETE_TIMEOUT_MS })
    .toBeGreaterThan(1);
  await locationInput.press('Enter');
  // The location picker lives in the search dialog; until it closes it
  // intercepts clicks on the filter panel behind it.
  await expectSearchDialogDismissed(page);
  await expectPageUrl(page, (u) => u.searchParams.has('location'));
  await waitForSearchResultsSettled(page);
}

/** The results page's search-bar trigger (shows the active query label). */
export function getSearchBarTrigger(page: Page) {
  return page.getByTestId('search-trigger').first();
}

/** Asserts the search-bar trigger shows `text` (the active query label). */
export async function expectSearchBarText(page: Page, text: string | RegExp) {
  await expect(getSearchBarTrigger(page)).toHaveText(text, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/**
 * The "Add my location" / current-location button directly below the search
 * bar on the results page. Its visible text is the active location, or
 * "Add my location" when none is set (`AddMyLocationButton`).
 */
export function getLocationBelowSearch(page: Page) {
  return page
    .locator('#filter-panel')
    .getByRole('button', { name: /^(add my location|change location:)/i })
    .first();
}

/** Asserts no location is applied: the button below the search bar offers "Add my location". */
export async function expectNoLocationBelowSearch(page: Page) {
  const button = getLocationBelowSearch(page);
  await expect(button).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await expect(button).toHaveText(/^\s*add my location\s*$/i);
  expect(new URL(page.url()).searchParams.get('location')).toBeNull();
}

/** Asserts `location` is shown directly below the search bar. */
export async function expectLocationBelowSearch(page: Page, location: string) {
  const button = getLocationBelowSearch(page);
  await expect(button).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await expect(button).toHaveText(location, { timeout: UI_SHELL_TIMEOUT_MS });
}

/** The "Sort by" select trigger on the results page (`SortSelect`). */
export function getSortSelect(page: Page) {
  return page.locator('#sort-select');
}

/** Asserts the "Sort by" select shows `label` (e.g. "Most Relevant"). */
export async function expectSortLabel(page: Page, label: string) {
  await expect(getSortSelect(page)).toHaveText(label, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/** Picks a "Sort by" option and waits for the re-sorted results to settle. */
export async function selectSortOption(page: Page, label: string) {
  await getSortSelect(page).click();
  const option = page.getByRole('option', { name: label, exact: true });
  await expect(option).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await option.click();
  await expectPageUrl(page, (u) => u.searchParams.has('sort'));
  await waitForSearchResultsSettled(page);
  await expectSortLabel(page, label);
}

/**
 * Waits for the search dialog's autocomplete to show resolved options and
 * returns the listbox. Groups ("Suggestions", "Topics", "Taxonomies") are
 * `role="group"` elements labelled by their heading.
 */
export async function waitForAutocompleteOptions(page: Page) {
  const listbox = page.getByTestId('autocomplete-listbox');
  await expect(listbox).toBeVisible({ timeout: AUTOCOMPLETE_TIMEOUT_MS });
  await expect(listbox.getByTestId('autocomplete-option').first()).toBeVisible({
    timeout: AUTOCOMPLETE_TIMEOUT_MS,
  });
  return listbox;
}

/** An autocomplete option within a named group (e.g. "Topics"), matched on its full text. */
export function getAutocompleteOptionInGroup(
  page: Page,
  group: string,
  text: string | RegExp,
) {
  return page
    .getByTestId('autocomplete-listbox')
    .getByRole('group', { name: group, exact: true })
    .getByTestId('autocomplete-option')
    .filter({ hasText: text });
}

/**
 * Submits the open search dialog via its "Search" button and waits for the
 * results page to render.
 */
export async function submitSearchDialog(page: Page) {
  const submitButton = page.getByTestId('search-submit-btn');
  await expect(submitButton).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });
  await submitButton.click();
  await expectPageUrl(page, isSearchResultsListUrl);
  await expectSearchDialogDismissed(page);
  await waitForSearchResultsSettled(page);
}

/**
 * From the results page: clicks "Add my location", types `typed` into the
 * location box, picks the exact `suggestion` from the dropdown and asserts it
 * populated the box. Leaves the dialog open so callers submit explicitly.
 */
export async function chooseLocationFromSearchPage(
  page: Page,
  { typed, suggestion }: { typed: string; suggestion: string },
) {
  await getLocationBelowSearch(page).click();
  await expect(page.getByTestId('search-dialog')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });

  const locationInput = page.locator('#location-input');
  await expect(locationInput).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await locationInput.fill(typed);

  const option = page
    .getByTestId('autocomplete-listbox')
    .getByTestId('autocomplete-option')
    .filter({
      hasText: new RegExp(`^\\s*${toSingleRegexLiteral(suggestion)}\\s*$`),
    });
  await expect(option.first()).toBeVisible({
    timeout: AUTOCOMPLETE_TIMEOUT_MS,
  });
  await option.first().click();

  await expect(locationInput).toHaveValue(suggestion, {
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}

/**
 * A result card on the results/favorites page by its exact resource name.
 * Cards are the `div[id]` wrapping the `resourceName` layout component.
 */
export function getResultCardByName(page: Page, name: string) {
  return page
    .locator('div[id]:has(> div > [data-component-id="resourceName"])')
    .filter({
      has: page.getByTestId('resource-link').filter({
        hasText: new RegExp(`^\\s*${toSingleRegexLiteral(name)}\\s*$`),
      }),
    });
}

/** All result cards currently rendered on the page. */
export function getResultCards(page: Page) {
  return page.locator(
    'div[id]:has(> div > [data-component-id="resourceName"])',
  );
}

/**
 * Clicks a home-page guided search topic link (`CategoriesSection`): `section`
 * is the topic heading (its `ul` is labelled by it), `name` the link text.
 * Waits for the results page to settle.
 */
export async function openGuidedSearchTopic(
  page: Page,
  { section, name }: { section: string; name: string },
) {
  const link = page
    .getByRole('list', { name: section, exact: true })
    .getByRole('link', { name, exact: true });
  await expect(link).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await link.click();
  await expectPageUrl(page, isSearchResultsListUrl);
  await waitForSearchResultsSettled(page);
}

/** Asserts at least one result card is rendered. */
export async function expectResultsDisplayed(page: Page) {
  await expect(page.getByTestId('resource-link').first()).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
}
