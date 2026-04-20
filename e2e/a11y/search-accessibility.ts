import type { Locator, Page } from '@playwright/test';

import { expect, goHome, test } from '../helpers';
import enCommon from '../../public/locales/en/common.json' with { type: 'json' };

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
    await expect(searchStatus).toContainText(/results available/i);

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

  test('pressing Enter in the search autocomplete focuses location input instead of submitting', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const homeUrl = page.url();
    const searchInput = page.locator('#search-input');
    const locationInput = page.locator('#location-input');

    await searchInput.fill('food');
    await searchInput
      .locator('..')
      .getByTestId('autocomplete-listbox')
      .waitFor({ state: 'visible', timeout: 10_000 });

    await searchInput.press('Enter');

    await expect(locationInput).toBeFocused({ timeout: 5_000 });
    await expect(page).toHaveURL(homeUrl);
    await expect(page.getByTestId('search-dialog')).toBeVisible();
  });

  test('pressing Enter in the location autocomplete submits the form', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const locationInput = page.locator('#location-input');

    await locationInput.fill('minneapolis');
    await locationInput
      .locator('..')
      .getByTestId('autocomplete-listbox')
      .waitFor({ state: 'visible', timeout: 10_000 });

    await locationInput.press('Enter');

    // Form should submit and navigate to search page
    await expect(page).toHaveURL(/\/search/, { timeout: 5_000 });
  });

  test('clicking X on location input sets "Everywhere"', async ({ page }) => {
    await openDialogFromSearchTrigger(page);

    const locationInput = page.locator('#location-input');
    const clearButtons = page.getByTestId('search-clear-btn');

    await locationInput.fill('minneapolis');
    await expect(clearButtons.nth(1)).toBeVisible();

    await clearButtons.nth(1).click();

    await expect(locationInput).toHaveValue(enCommon.search.everywhere);
  });

  test('autocomplete groups appear in correct order: Suggestions, Topics, Taxonomies', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const searchInput = page.locator('#search-input');
    await searchInput.fill('o');

    const listbox = page.getByTestId('autocomplete-listbox').first();
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const groups = await listbox
      .locator('[role="presentation"]')
      .allTextContents();

    // Filter out empty strings
    const nonEmptyGroups = groups.filter((g) => g.trim().length > 0);

    if (nonEmptyGroups.length >= 2) {
      // If we have Suggestions, it should come before Topics
      const suggestionsIndex = nonEmptyGroups.findIndex((g) =>
        /suggestions/i.test(g),
      );
      const topicsIndex = nonEmptyGroups.findIndex((g) =>
        /categories/i.test(g),
      );
      const taxonomiesIndex = nonEmptyGroups.findIndex((g) =>
        /taxonomies/i.test(g),
      );

      if (suggestionsIndex >= 0 && topicsIndex >= 0) {
        expect(suggestionsIndex).toBeLessThan(topicsIndex);
      }
      if (topicsIndex >= 0 && taxonomiesIndex >= 0) {
        expect(topicsIndex).toBeLessThan(taxonomiesIndex);
      }
      if (suggestionsIndex >= 0 && taxonomiesIndex >= 0) {
        expect(suggestionsIndex).toBeLessThan(taxonomiesIndex);
      }
    }
  });

  test('arrow key navigation preserves all autocomplete options without filtering', async ({
    page,
  }) => {
    await openDialogFromSearchTrigger(page);

    const searchInput = page.locator('#search-input');
    await searchInput.fill('o');

    const listbox = page.getByTestId('autocomplete-listbox').first();
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    // Get initial option count
    const initialOptions = await listbox.locator('[role="option"]').count();
    expect(initialOptions).toBeGreaterThan(1);

    // Navigate down with arrow key
    await searchInput.press('ArrowDown');

    // Wait a bit for any potential filtering
    await page.waitForTimeout(300);

    // Option count should remain the same
    const optionsAfterArrowDown = await listbox
      .locator('[role="option"]')
      .count();
    expect(optionsAfterArrowDown).toBe(initialOptions);

    // Navigate down again
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(300);

    // Option count should still be the same
    const optionsAfterSecondArrow = await listbox
      .locator('[role="option"]')
      .count();
    expect(optionsAfterSecondArrow).toBe(initialOptions);
  });
});
