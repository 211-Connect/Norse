import type { Page } from '@playwright/test';

/**
 * Non-throwing visibility check for internal branching logic (e.g. deciding
 * between "already on page" vs "auth prompt appeared" vs "still pending").
 * Not exported from the barrel — use web-first `expect(...).toBeVisible()`
 * in test bodies instead.
 */
export async function isVisible(locator: ReturnType<Page['locator']>) {
  return locator.isVisible().catch(() => false);
}
