import { LOAD_SHED_RETRY_AFTER_SECONDS } from './config';
import type { LoadShedTenant } from './tenant-registry';

/**
 * The 429 "busy" page, built as a string: no React render, no data fetch,
 * so it costs almost nothing on an overloaded server. Branded with what
 * the tenant registry knows (name, logo, primary colour), generic
 * otherwise. The Refresh button is a link to the same URL, so it works
 * without JavaScript.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Only a plain hex colour reaches the CSS. */
function safeColor(value: string | undefined): string {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '#1f4e79';
}

/** Only an absolute http(s) URL or a site-relative path is used as the logo. */
function safeLogoUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function renderBusyPage(tenant: LoadShedTenant | undefined): string {
  const name = tenant?.name ? escapeHtml(tenant.name) : '';
  const color = safeColor(tenant?.primaryColor);
  const logoUrl = safeLogoUrl(tenant?.logoUrl);
  const logo = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="${name}">`
    : '';
  const site = name ? ` on ${name}` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name ? `${name}: ` : ''}Please try again in a moment</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f6f7f9; color: #1d2433; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 32rem; margin: 1rem; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); text-align: center; }
  .logo { max-width: 12rem; max-height: 4rem; margin-bottom: 1.5rem; }
  h1 { font-size: 1.375rem; margin: 0 0 .75rem; }
  p { margin: 0 0 1.5rem; color: #4a5568; }
  a.button { display: inline-block; padding: .75rem 1.5rem; border-radius: 8px; background: ${color}; color: #fff; font-weight: 600; text-decoration: none; }
  a.button:focus-visible { outline: 3px solid #1d2433; outline-offset: 2px; }
</style>
</head>
<body>
<main>
${logo}
<h1>We're busy right now</h1>
<p>A lot of people are searching${site} at the moment. Please wait a few seconds and try again.</p>
<a class="button" href="">Refresh</a>
</main>
</body>
</html>`;
}

/** Plain-text body for RSC navigations and the map pins API. */
export const BUSY_TEXT = 'Too many requests. Please try again shortly.';

export function busyHeaders(html: boolean): Record<string, string> {
  return {
    'content-type': html
      ? 'text/html; charset=utf-8'
      : 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'retry-after': String(LOAD_SHED_RETRY_AFTER_SECONDS),
    'x-robots-tag': 'noindex',
  };
}
