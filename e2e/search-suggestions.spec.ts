import { expect, goHome, openSearchDialog, test } from './helpers';
import { ASYNC_UI_TIMEOUT_MS, AUTOCOMPLETE_TIMEOUT_MS } from './timeouts';

function normalizeOptionText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractSearchProbe(optionTexts: string[]): string | null {
  for (const text of optionTexts) {
    const tokens = normalizeOptionText(text)
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);

    const candidate = tokens.sort((a, b) => b.length - a.length)[0];
    if (candidate) {
      return candidate.slice(0, Math.min(candidate.length, 8)).toLowerCase();
    }
  }

  return null;
}

test.describe('Search suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('shows default suggestions on focus and updates suggestions as the user types', async ({
    page,
  }) => {
    const searchInput = await openSearchDialog(page);
    const listbox = page.getByTestId('autocomplete-listbox');
    const options = listbox.getByTestId('autocomplete-option');

    await expect(listbox).toBeVisible({ timeout: AUTOCOMPLETE_TIMEOUT_MS });

    await expect
      .poll(async () => options.count(), {
        timeout: ASYNC_UI_TIMEOUT_MS,
        intervals: [100, 250, 500, 1_000],
      })
      .toBeGreaterThan(0);

    const initialTexts = (await options.allTextContents())
      .map(normalizeOptionText)
      .filter(Boolean);
    expect(initialTexts.length).toBeGreaterThan(0);

    const probe = extractSearchProbe(initialTexts);
    test.skip(
      !probe,
      'Current tenant suggestions did not expose a stable token to type back into the search box',
    );
    const typedProbe = probe as string;

    await searchInput.fill(typedProbe);

    await expect
      .poll(
        async () => {
          const nextTexts = (await options.allTextContents())
            .map(normalizeOptionText)
            .filter(Boolean);

          return (
            nextTexts.length > 0 &&
            nextTexts.some((text) => text.toLowerCase().includes(typedProbe))
          );
        },
        {
          timeout: ASYNC_UI_TIMEOUT_MS,
          intervals: [100, 250, 500, 1_000],
        },
      )
      .toBe(true);

    const typedTexts = (await options.allTextContents())
      .map(normalizeOptionText)
      .filter(Boolean);
    const typedSignature = typedTexts.join(' | ');

    const probeMiss = `${typedProbe}zzzzzz`;
    await searchInput.fill(probeMiss);

    await expect
      .poll(
        async () => {
          const nextTexts = (await options.allTextContents())
            .map(normalizeOptionText)
            .filter(Boolean);

          return {
            count: nextTexts.length,
            changedFromTyped: nextTexts.join(' | ') !== typedSignature,
          };
        },
        {
          timeout: ASYNC_UI_TIMEOUT_MS,
          intervals: [100, 250, 500, 1_000],
        },
      )
      .toMatchObject({
        changedFromTyped: true,
      });
  });
});
