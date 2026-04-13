import type { Locator, Page } from '@playwright/test';

import { expect, goHome, test } from '../helpers';

async function openDialogFromSearchTrigger(page: Page) {
  const trigger = page.getByTestId('search-trigger').first();
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-controls', 'search-dialog');

  await trigger.click();

  const dialog = page.getByTestId('search-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  return { dialog, trigger };
}

async function getAddMyLocationButton(page: Page) {
  const button = page
    .getByRole('button', { name: /add my location|change location/i })
    .first();

  await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(button).toHaveAttribute('aria-controls', 'search-dialog');

  return button;
}

async function expectFocusToStayInDialog(dialog: Locator) {
  await expect
    .poll(async () => {
      return dialog.evaluate((node) => node.contains(document.activeElement));
    })
    .toBe(true);
}

async function getComboboxLabelText(page: Page, inputId: string) {
  return page.evaluate((id) => {
    const input = document.getElementById(id);
    const labelId = input?.getAttribute('aria-labelledby');
    return labelId ? document.getElementById(labelId)?.textContent?.trim() : '';
  }, inputId);
}

test.describe('Search accessibility preservation', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('dialog triggers stay semantic and avoid nested interactive controls', async ({
    page,
  }) => {
    const { trigger } = await openDialogFromSearchTrigger(page);
    await expect(trigger).toHaveJSProperty('tagName', 'BUTTON');

    const addMyLocationButton = await getAddMyLocationButton(page);
    await expect(addMyLocationButton).toHaveJSProperty('tagName', 'BUTTON');
    await expect(addMyLocationButton.locator('input')).toHaveCount(0);
  });

  test('search trigger opens a labelled dialog and Escape restores focus', async ({
    page,
  }) => {
    const { dialog, trigger } = await openDialogFromSearchTrigger(page);
    const labelledDialog = page.getByRole('dialog', { name: /search/i });
    const searchInput = page.locator('#search-input');

    await expect(labelledDialog).toBeVisible();
    await expect(searchInput).toBeFocused({ timeout: 5_000 });

    const descriptionId = await dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(page.locator(`#${descriptionId}`)).toContainText(
      /search for resources/i,
    );

    await page.keyboard.press('Escape');

    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toBeFocused();
  });

  test('Add my location opens the dialog with focus on the location input', async ({
    page,
  }) => {
    const addMyLocationButton = await getAddMyLocationButton(page);
    await addMyLocationButton.click();

    const dialog = page.getByTestId('search-dialog');
    const locationInput = page.locator('#location-input');

    await expect(dialog).toBeVisible();
    await expect(locationInput).toBeFocused({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await expect(addMyLocationButton).toBeFocused();
  });

  test('dialog focus stays trapped while tabbing forward and backward', async ({
    page,
  }) => {
    const { dialog } = await openDialogFromSearchTrigger(page);

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      await expectFocusToStayInDialog(dialog);
    }

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Shift+Tab');
      await expectFocusToStayInDialog(dialog);
    }
  });

  test('search and location comboboxes expose labels and keyboard-clear actions', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const searchInput = page.locator('#search-input');
    const locationInput = page.locator('#location-input');

    const searchLabel = await getComboboxLabelText(page, 'search-input');
    const locationLabel = await getComboboxLabelText(page, 'location-input');

    expect(searchLabel).toMatch(/search for resources/i);
    expect(locationLabel).toMatch(/search for a location/i);

    await searchInput.fill('food');
    const clearButtons = page.getByTestId('search-clear-btn');

    await expect(clearButtons.first()).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(clearButtons.first()).toBeFocused();
    await expect(clearButtons.first()).toHaveAttribute('aria-label', /remove/i);

    await page.keyboard.press('Enter');
    await expect(searchInput).toHaveValue('');

    await locationInput.fill('minneapolis');
    await expect(clearButtons.nth(1)).toBeVisible();
    await locationInput.focus();
    await page.keyboard.press('Tab');
    await expect(clearButtons.nth(1)).toBeFocused();
  });

  test('autocomplete announces suggestions and keeps the popover scrollable in constrained layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await goHome(page);
    await openDialogFromSearchTrigger(page);

    const searchInput = page.locator('#search-input');
    const searchStatus = page
      .locator('[role="status"][aria-live="polite"]')
      .first();

    await searchInput.fill('food');

    const listbox = page.getByTestId('autocomplete-listbox');
    await expect(listbox).toBeVisible({ timeout: 10_000 });
    await expect(searchStatus).toContainText(/suggestion/i);

    const metrics = await listbox.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        bottom: element.getBoundingClientRect().bottom,
        clientHeight: element.clientHeight,
        overflowY: style.overflowY,
        scrollHeight: element.scrollHeight,
        viewportHeight: window.innerHeight,
      };
    });

    expect(metrics.clientHeight).toBeGreaterThan(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
    expect(['auto', 'scroll']).toContain(metrics.overflowY);
    expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);
  });

  test('pressing Enter in the location autocomplete returns focus to search instead of submitting', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const homeUrl = page.url();
    const locationInput = page.locator('#location-input');
    const searchInput = page.locator('#search-input');

    await locationInput.fill('minneapolis');
    await page.getByTestId('autocomplete-listbox').waitFor({
      state: 'visible',
      timeout: 10_000,
    });

    await locationInput.press('Enter');

    await expect(searchInput).toBeFocused({ timeout: 5_000 });
    await expect(page).toHaveURL(homeUrl);
    await expect(page.getByTestId('search-dialog')).toBeVisible();
  });
});
