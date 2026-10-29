import { PrintableDirectoryDefaultQueryConfigDto } from '@/lib/api/generated/data-contracts';

/**
 * A query source's search params with the directory's default location
 * filled in where the source has none — the same rule the Norse API applies
 * when resolving the source for the PDF (`withDefaultQueryParams`), so
 * "Go to search results" shows what the PDF prints.
 */
export function withDefaultQueryParams(
  params: Record<string, unknown>,
  defaultQueryConfig:
    PrintableDirectoryDefaultQueryConfigDto | null | undefined,
): Record<string, unknown> {
  const merged = { ...params };

  if (!defaultQueryConfig) {
    return merged;
  }

  const { coords, locationName, radius, regionId } = defaultQueryConfig;

  // An area default applies only to sources with no location of their own.
  if (regionId && merged.region == null && merged.coords == null) {
    merged.region = regionId;
  }

  if (merged.coords == null && coords) {
    merged.coords = `${coords.longitude},${coords.latitude}`;

    if (merged.location == null && locationName) {
      merged.location = locationName;
    }
  }

  // A Region is searched as its shape: no radius.
  if (merged.region == null && merged.distance == null && radius != null) {
    merged.distance = radius;
  }

  return merged;
}
