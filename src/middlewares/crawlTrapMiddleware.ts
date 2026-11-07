import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasCrawlTrapKey } from '@/lib/crawl-trap';

/**
 * `410 Gone` for any request whose query has a crawl-trap key (`amp;…`, see `src/lib/crawl-trap.ts`), on
 * every route and tenant. It runs before the tenant lookup, so a trapped request costs no CMS call, no
 * search and no Arcjet decision. 410 tells search engines to drop the URL rather than retry it.
 */
export function crawlTrapMiddleware(
  request: NextRequest,
): NextResponse | undefined {
  if (!hasCrawlTrapKey(request.nextUrl.searchParams)) return undefined;
  return new NextResponse('Gone', {
    status: 410,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'noindex',
      'cache-control': 'public, max-age=86400',
    },
  });
}
