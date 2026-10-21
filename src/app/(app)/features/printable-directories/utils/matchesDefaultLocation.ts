import { PrintableDirectoryDefaultQueryConfigDto } from '@/lib/api/generated/data-contracts';

import { getLocationConflict } from './getLocationConflict';

/**
 * Whether a query's location params are just the directory's default
 * location — e.g. filled in by `withDefaultQueryParams()` for "Go to search
 * results". Saving them would pin the source to that place, so it would no
 * longer follow later changes to the directory's default location.
 */
export function matchesDefaultLocation(
  defaultQueryConfig:
    PrintableDirectoryDefaultQueryConfigDto | null | undefined,
  queryParams: Record<string, unknown>,
): boolean {
  if (!defaultQueryConfig?.coords || !queryParams.coords) {
    return false;
  }

  if (getLocationConflict(defaultQueryConfig, queryParams)) {
    return false;
  }

  const { radius } = defaultQueryConfig;

  return (
    queryParams.distance == null ||
    radius == null ||
    Number(queryParams.distance) === radius
  );
}
