import { type Locator, type Page, expect } from '@playwright/test';

import {
  ASYNC_UI_TIMEOUT_MS,
  MAP_PINS_LOAD_TIMEOUT_MS,
  PRESENCE_PROBE_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from '../timeouts';

/**
 * The search map's container. Its circles are drawn on a canvas, so the map
 * writes what it shows into data attributes each time it settles (`idle`):
 * `data-zoom`, `data-shown-places` (circles in view) and `data-shown-counts`
 * (circles in view showing their number of resources).
 */
export function getSearchMap(page: Page) {
  return page.getByTestId('search-map');
}

/** Reads one of the map's numeric `data-*` attributes (0 until it first settles). */
export async function getSearchMapNumber(
  page: Page,
  attribute: 'data-zoom' | 'data-shown-places' | 'data-shown-counts',
) {
  return Number((await getSearchMap(page).getAttribute(attribute)) ?? 0);
}

/**
 * Waits for the legend, then for its "Loading all locations…" row to go: all
 * of the search's pins have arrived within `MAP_PINS_LOAD_TIMEOUT_MS`.
 */
export async function waitForMapPinsLoaded(page: Page) {
  await expect(page.getByTestId('map-legend')).toBeVisible({
    timeout: UI_SHELL_TIMEOUT_MS,
  });
  await expect(page.getByTestId('map-legend-loading')).toBeHidden({
    timeout: MAP_PINS_LOAD_TIMEOUT_MS,
  });
}

/**
 * Circles of the list's current page that stand for several resources at one
 * address. Each list circle has an invisible DOM target over it, carrying its
 * number of resources in `data-resources`.
 */
export function getSharedListMapPoints(page: Page) {
  return getSearchMap(page).locator(
    '[data-testid="map-point"]:not([data-resources="1"])',
  );
}

/** Circles of the list's current page with a single resource at their address. */
export function getSingleListMapPoints(page: Page) {
  return getSearchMap(page).locator(
    '[data-testid="map-point"][data-resources="1"]',
  );
}

/** The centre of a list circle's target, which is the circle's centre on the canvas. */
async function getCenter(point: Locator) {
  const box = await point.boundingBox();
  if (!box) throw new Error('The map point has no box: is it in view?');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Zooms the map in with the mouse wheel over `point`, which stays under the
 * cursor, until some circle in view shows its count.
 */
export async function zoomInUntilCountsShow(page: Page, point: Locator) {
  const { x, y } = await getCenter(point);
  await page.mouse.move(x, y);

  await expect(async () => {
    await page.mouse.wheel(0, -300);
    await expect
      .poll(() => getSearchMapNumber(page, 'data-shown-counts'), {
        timeout: PRESENCE_PROBE_TIMEOUT_MS,
      })
      .toBeGreaterThan(0);
  }).toPass({ timeout: ASYNC_UI_TIMEOUT_MS });
}

/**
 * Clicks a list circle on the canvas. Its DOM target lets the mouse through
 * (`pointer-events: none`), so the click is sent to its position.
 */
export async function clickMapPoint(page: Page, point: Locator) {
  const { x, y } = await getCenter(point);
  await page.mouse.click(x, y);
}
