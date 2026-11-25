import { withoutCrawlTrapKeys } from '@/lib/crawl-trap';

/**
 * Pure: whether the v2 results page shows the radius dropdown. Only for an address search (a point,
 * so coordinates and no area region) and only when the tenant set radiusSelectValues in Payload
 * (Lucas 2026-11-20). An area (state, county, city, ZIP) is searched as its shape: no radius.
 */
export function showsRadiusSelect({
  radiusValues,
  hasCoordinates,
  region,
}: {
  radiusValues: { value?: number | null }[] | undefined;
  hasCoordinates: boolean;
  region: string | null | undefined;
}): boolean {
  const configured = (radiusValues ?? []).some(
    (option) => typeof option.value === 'number',
  );
  return configured && hasCoordinates && !region;
}

/** The current search with a new `distance`, back on the first page, without crawl-trap keys. */
export function radiusHref(
  pathname: string | null,
  searchParams: URLSearchParams | null | undefined,
  distance: string,
): string {
  const params = withoutCrawlTrapKeys(
    new URLSearchParams(searchParams?.toString()),
  );
  params.set('distance', distance);
  params.delete('page');
  return `${pathname ?? ''}?${params.toString()}`;
}
