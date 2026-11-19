import { withoutCrawlTrapKeys } from '@/lib/crawl-trap';

/** The current search sorted by `sort`, back on the first page, without crawl-trap keys (ISS-2307). */
export function sortHref(
  pathname: string | null,
  searchParams: URLSearchParams | null | undefined,
  sort: string,
): string {
  const params = withoutCrawlTrapKeys(
    new URLSearchParams(searchParams?.toString()),
  );
  params.set('sort', sort);
  params.delete('page');
  return `${pathname ?? ''}?${params.toString()}`;
}
