// Cut-over scaffolding (ISS-2372): deleted by ISS-2377.
//
// One live visit to one search URL, as a visitor's browser sees it. Every request to another origin is
// aborted: the Umami script is loaded from its own host and only reports through it, so no runner visit can
// reach analytics (nor Feathr, maps or fonts). The runner announces itself in its User-Agent.
import { chromium, type Browser, type Request } from '@playwright/test';

import type { Hop, Visit } from './compare';

export const RUNNER_USER_AGENT =
  'Mozilla/5.0 (compatible; Connect211-SearchParity/1.0; +https://linear.app/connect211/issue/ISS-2372)';

/** Statuses that mean the runner was not shown the page: a denial or a server error. */
const UNVERIFIABLE = (status: number) =>
  status === 403 || status === 429 || status >= 500;

export function launchBrowser(): Promise<Browser> {
  // PARITY_HOST_RULES="MAP rf-wa211.c211.io 1.2.3.4" pins a host whose DNS the local resolver does not have yet.
  const rules = process.env.PARITY_HOST_RULES;
  return chromium.launch({
    args: rules ? [`--host-resolver-rules=${rules}`] : [],
  });
}

const relative = (url: string, origin: string) =>
  url.startsWith(origin) ? url.slice(origin.length) || '/' : url;

async function chainOf(last: Request, origin: string): Promise<Hop[]> {
  const requests: Request[] = [];
  for (let r: Request | null = last; r; r = r.redirectedFrom())
    requests.unshift(r);
  const hops: Hop[] = [];
  for (const r of requests) {
    const response = await r.response();
    hops.push({
      url: relative(r.url(), origin),
      status: response?.status() ?? 0,
    });
  }
  return hops;
}

export async function observe(
  browser: Browser,
  url: string,
  { timeoutMs = 45_000 }: { timeoutMs?: number } = {},
): Promise<Visit> {
  const origin = new URL(url).origin;
  const context = await browser.newContext({ userAgent: RUNNER_USER_AGENT });
  const blocked = new Set<string>();
  await context.route('**/*', (route) => {
    const target = new URL(route.request().url());
    if (target.origin === origin) return route.continue();
    blocked.add(target.host);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    });
    if (!response) return { ok: false, reason: 'no response' };
    if (UNVERIFIABLE(response.status()))
      return { ok: false, reason: `HTTP ${response.status()}` };
    if (new URL(page.url()).origin !== origin)
      return {
        ok: false,
        reason: `left the site for ${new URL(page.url()).origin}`,
      };
    // Trackers are aborted, so the network goes quiet once the page and its client effects (the clarify
    // dialog opens after hydration) are done.
    await page
      .waitForLoadState('networkidle', { timeout: timeoutMs })
      .catch(() => undefined);
    const options = page.locator(
      '[data-testid="ai-classification-options"] button',
    );
    const alert = page.locator('#search-container [role="alert"]');
    const total = page.locator('#result-total');
    return {
      ok: true,
      observation: {
        chain: await chainOf(response.request(), origin),
        finalUrl: relative(page.url(), origin),
        title: await page.title(),
        resultTotal: (await total.count())
          ? ((await total.first().textContent()) ?? '').trim()
          : null,
        resultIds: (
          await page
            .getByTestId('resource-link')
            .evaluateAll((links) =>
              links.slice(0, 10).map((l) => l.getAttribute('href') ?? ''),
            )
        ).map((href) => relative(href, origin)),
        clarify: {
          open: await page.getByTestId('ai-classification-options').isVisible(),
          options: await options.evaluateAll((buttons) =>
            buttons.map(
              (b) =>
                `${(b.textContent ?? '').trim().split('\n')[0]}${
                  b.getAttribute('aria-pressed') === 'true' ? ' [selected]' : ''
                }`,
            ),
          ),
        },
        alert: (await alert.count())
          ? ((await alert.first().textContent()) ?? '').trim()
          : null,
        blockedHosts: [...blocked].sort(),
      },
    };
  } catch (e) {
    return { ok: false, reason: (e as Error).message.split('\n')[0] };
  } finally {
    await context.close();
  }
}
