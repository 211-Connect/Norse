import { type BrowserContext, type Page, expect } from '@playwright/test';

import {
  ASYNC_UI_TIMEOUT_MS,
  PAGE_LOAD_TIMEOUT_MS,
  UI_SHELL_TIMEOUT_MS,
} from '../timeouts';

/**
 * Opens the share dialog from the page's first `share-btn` — the same
 * testid on the search results header, the resource detail nav, and a
 * public favorite list's actions — and waits for the async-generated short
 * URL to be ready. Returns the short URL text with the dialog left open.
 */
export async function openShareDialogAndGetShortUrl(
  page: Page,
): Promise<string> {
  const shareBtn = page.getByTestId('share-btn').first();
  await expect(shareBtn).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });
  await shareBtn.click();

  const dialog = page.getByTestId('share-dialog');
  await expect(dialog).toBeVisible({ timeout: UI_SHELL_TIMEOUT_MS });

  const copyShortUrlBtn = dialog.getByTestId('copy-short-url-btn');
  await expect(copyShortUrlBtn).toBeEnabled({ timeout: ASYNC_UI_TIMEOUT_MS });

  const shortUrl = ((await copyShortUrlBtn.textContent()) ?? '').trim();
  if (!/^https?:\/\//.test(shortUrl)) {
    throw new Error(`Expected a generated short URL, got: "${shortUrl}"`);
  }

  return shortUrl;
}

export async function closeShareDialog(page: Page) {
  const dialog = page.getByTestId('share-dialog');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden({ timeout: UI_SHELL_TIMEOUT_MS });
}

/**
 * Opens `shortUrl` in a brand-new page within `context` — simulating someone
 * who received the link with no prior app session or in-page state — and
 * waits for the server-side `/share/[shortCode]` redirect to land. Caller
 * owns the returned page's lifecycle (close it when done).
 */
export async function openShortUrlInNewPage(
  context: BrowserContext,
  shortUrl: string,
): Promise<Page> {
  const newPage = await context.newPage();
  await newPage.goto(shortUrl, {
    waitUntil: 'domcontentloaded',
    timeout: PAGE_LOAD_TIMEOUT_MS,
  });
  return newPage;
}
