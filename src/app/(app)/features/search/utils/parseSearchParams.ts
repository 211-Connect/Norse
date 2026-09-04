import { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import { getSortOption } from '@/app/(app)/shared/utils/getSortOption';
import { parseCommaSeparatedValues } from '@/app/(app)/shared/utils/parseCommaSeparatedValues';
import qs from 'qs';

export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Parse the raw Next.js searchParams (which may contain bracket-notation filter keys
 * like `filters[key][0]=val`) into a typed FindResourcesQuery object.
 */
export function parseSearchParams(raw: RawSearchParams): FindResourcesQuery {
  const entries = Object.entries(raw).flatMap(([k, v]) =>
    (Array.isArray(v) ? v : [v ?? '']).map(
      (val) => [k, val] as [string, string],
    ),
  );
  const parsed = qs.parse(new URLSearchParams(entries).toString());

  const coordsStr =
    typeof parsed.coords === 'string' ? parsed.coords : undefined;
  const coordinates = coordsStr
    ? coordsStr
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n))
    : undefined;
  const sort = getSortOption(String(parsed.sort), coordinates);

  const rawLocation =
    typeof parsed.location === 'string'
      ? parsed.location || undefined
      : undefined;
  const location =
    rawLocation && rawLocation.trim().toLowerCase() === 'everywhere'
      ? undefined
      : rawLocation;

  return {
    query:
      typeof parsed.query === 'string' ? parsed.query || undefined : undefined,
    queryLabel:
      typeof parsed.query_label === 'string'
        ? parsed.query_label || undefined
        : undefined,
    queryType:
      typeof parsed.query_type === 'string'
        ? parsed.query_type || undefined
        : undefined,
    organizationId:
      typeof parsed.organization_id === 'string'
        ? parsed.organization_id || undefined
        : undefined,
    location,
    coordinates,
    distance:
      typeof parsed.distance === 'string'
        ? parsed.distance || undefined
        : undefined,
    taxonomy: parseCommaSeparatedValues(raw.taxonomy),
    filters: parsed.filters as Record<string, string[]> | undefined,
    sort,
    age:
      typeof parsed.age === 'string' && parsed.age
        ? parseInt(parsed.age, 10) || undefined
        : undefined,
  };
}
