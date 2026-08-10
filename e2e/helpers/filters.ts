import { type Page, expect } from '@playwright/test';

import { UI_SHELL_TIMEOUT_MS } from '../timeouts';
import { parseTrailingInteger } from './url';

/**
 * Filter checkboxes are `disabled` while a search navigation is in-flight
 * (`isPending` in filter-panel). Wait until the panel is interactive.
 */
export async function waitForFilterPanelInteractive(page: Page) {
  const first = page.locator('#filter-panel [role="checkbox"]').first();
  await expect(first).toBeEnabled({ timeout: UI_SHELL_TIMEOUT_MS });
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
