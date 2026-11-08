import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasCrawlTrapKey, withoutCrawlTrapKeys } from '@/lib/crawl-trap';

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** The same path without the crawl-trap keys: where a person who followed a mangled link meant to go. */
function cleanedHref(request: NextRequest): string {
  const query = withoutCrawlTrapKeys(request.nextUrl.searchParams).toString();
  return `${request.nextUrl.pathname}${query ? `?${query}` : ''}`;
}

/**
 * `410 Gone` for any request whose query has a crawl-trap key (`amp;…`, see `src/lib/crawl-trap.ts`), on every
 * page route the proxy matches (not `/api`, `/admin`, static files, `robots.txt` or `sitemap.xml`) and every
 * tenant. It runs before the tenant lookup, so a trapped request costs no CMS call, no search and no Arcjet
 * decision. 410 tells search engines to drop the URL rather than retry it. The body is a tiny page linking to
 * the same URL without the broken keys, for a person who followed a mangled link; the link is `nofollow`.
 */
export function crawlTrapMiddleware(
  request: NextRequest,
): NextResponse | undefined {
  if (!hasCrawlTrapKey(request.nextUrl.searchParams)) return undefined;
  const href = escapeHtml(cleanedHref(request));
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"><title>This link is broken</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5">
<h1>This link is broken</h1>
<p>The address you followed was damaged when it was copied.</p>
<p><a href="${href}" rel="nofollow">Continue to the page you were looking for</a></p>
</body>
</html>
`;
  return new NextResponse(html, {
    status: 410,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex',
      'cache-control': 'public, max-age=86400',
    },
  });
}
