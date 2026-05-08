import { type Locator, expect } from '@playwright/test';

const parseEnvMs = (value: string | undefined, fallback: number): number => {
  if (value == null || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

function firstDefinedEnv(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (a != null && a !== '') return a;
  if (b != null && b !== '') return b;
  return undefined;
}

/**
 * Per **single** action: search submit → `search?` URL, pagination, language
 * path change, return from auth, etc. (Typical 5–10s in prod; default cap 20s so
 * failures point at the step, not a stacked global limit.)
 *
 * @see E2E_SEARCH_NAV_TIMEOUT_MS — legacy: E2E_NAV_TIMEOUT_MS
 */
export const SEARCH_NAV_TIMEOUT_MS = parseEnvMs(
  firstDefinedEnv(
    process.env.E2E_SEARCH_NAV_TIMEOUT_MS,
    process.env.E2E_NAV_TIMEOUT_MS,
  ),
  40_000,
);

/**
 * One full navigation: `page.goto`, or waiting for a route to settle.
 * First hit on a cold Next dev server or CI can exceed 20s before
 * `domcontentloaded` — keep this in line with E2E_PAGE_LOAD_TIMEOUT_MS in CI.
 *
 * @see E2E_PAGE_LOAD_TIMEOUT_MS
 */
export const PAGE_LOAD_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_PAGE_LOAD_TIMEOUT_MS,
  40_000,
);

/**
 * Result shell, filter panel, dialogs, and other large visible regions.
 *
 * @see E2E_UI_SHELL_TIMEOUT_MS
 */
export const UI_SHELL_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_UI_SHELL_TIMEOUT_MS,
  20_000,
);

/**
 * Autocomplete listbox, small overlays in the search dialog.
 *
 * @see E2E_AUTOCOMPLETE_TIMEOUT_MS
 */
export const AUTOCOMPLETE_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_AUTOCOMPLETE_TIMEOUT_MS,
  10_000,
);

/**
 * Focus moves (dialog open → input focused, Tab to clear button, etc.).
 * Shorter than UI_SHELL; use for `toBeFocused` and short focus races.
 *
 * @see E2E_FOCUS_TIMEOUT_MS
 */
export const FOCUS_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_FOCUS_TIMEOUT_MS,
  5_000,
);

/**
 * Short settle after keyboard navigation when asserting no async UI change
 * (e.g. arrow keys through autocomplete). Not a "failure" cap — keeps tests
 * deterministic on slow machines.
 *
 * @see E2E_KEYBOARD_UI_STABILITY_MS
 */
export const KEYBOARD_UI_STABILITY_MS = parseEnvMs(
  process.env.E2E_KEYBOARD_UI_STABILITY_MS,
  300,
);

/**
 * Async UI work kicked off by an action: debounced searches, client-side
 * mutations followed by list refreshes, toast-backed server actions, etc.
 * Prefer waiting on visible UI completion signals within this budget instead of
 * using fixed `waitForTimeout(...)` sleeps.
 *
 * @see E2E_ASYNC_UI_TIMEOUT_MS
 */
export const ASYNC_UI_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_ASYNC_UI_TIMEOUT_MS,
  15_000,
);

/**
 * Cross-page favorites propagation after add/remove mutations. The write has
 * succeeded once the toast appears, but the server-rendered `/favorites/:id`
 * page may require one or more reloads before it reflects the new state.
 *
 * @see E2E_FAVORITES_PERSISTENCE_TIMEOUT_MS
 */
export const FAVORITES_PERSISTENCE_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_FAVORITES_PERSISTENCE_TIMEOUT_MS,
  30_000,
);

/**
 * Playwright `expect` (default) and `actionTimeout` (clicks, fill, type).
 * Keep aligned with `UI_SHELL` / `SEARCH_NAV` for one logical “step”.
 *
 * @see E2E_DEFAULT_ACTION_TIMEOUT_MS
 */
export const DEFAULT_ACTION_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_DEFAULT_ACTION_TIMEOUT_MS,
  20_000,
);

/**
 * Keycloak / IdP redirect chains (slower, out of our control).
 *
 * @see E2E_AUTH_NAV_TIMEOUT_MS
 */
export const AUTH_NAV_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_AUTH_NAV_TIMEOUT_MS,
  30_000,
);

/**
 * Playwright per-test ceiling only: must exceed (number of steps × per-action
 * timeouts) in the longest test. Per-step waits use SEARCH_NAV / PAGE_LOAD /
 * UI_SHELL, not this value.
 *
 * @see E2E_TEST_TIMEOUT_MS in playwright.config.ts
 */
export const TEST_TIMEOUT_MS = parseEnvMs(
  process.env.E2E_TEST_TIMEOUT_MS,
  300_000,
);

/**
 * Poll a locator until it becomes visible. Use after async UI work that may
 * finish at variable speeds across local runs and CI.
 */
export async function expectVisibleEventually(
  locator: Locator,
  options?: { timeout?: number },
) {
  await expect
    .poll(async () => locator.isVisible().catch(() => false), {
      timeout: options?.timeout ?? ASYNC_UI_TIMEOUT_MS,
      intervals: [100, 250, 500, 1_000],
    })
    .toBe(true);
}
