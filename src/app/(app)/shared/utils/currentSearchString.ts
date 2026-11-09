import { withoutCrawlTrapKeys } from '@/lib/crawl-trap';

/**
 * The current URL's query string, `?`-prefixed (or empty), with spaces as `%20`, for writers that copy the
 * URL the visitor is on (pagination, the language switch). Crawl-trap keys are dropped, so a copied URL is
 * never deeper than the one it came from (ISS-2307).
 */
export function currentSearchString(
  searchParams: URLSearchParams | null | undefined,
): string {
  const params = withoutCrawlTrapKeys(
    new URLSearchParams(searchParams?.toString()),
  )
    .toString()
    .replace(/\+/g, '%20');
  return params ? `?${params}` : '';
}
