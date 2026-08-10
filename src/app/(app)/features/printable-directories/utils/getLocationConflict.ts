import { PrintableDirectoryDefaultQueryConfigDto } from '@/lib/api/generated/data-contracts';

// ~50m — close enough to treat two coordinates as "the same place".
const COORDINATE_EPSILON_DEGREES = 0.0005;

const parseCoordsParam = (
  value: unknown,
): { latitude: number; longitude: number } | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const [longitudeRaw, latitudeRaw] = value.split(',');
  const longitude = Number(longitudeRaw);
  const latitude = Number(latitudeRaw);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return { latitude, longitude };
};

/**
 * Determines whether a query's location params (`coords`/`location`)
 * conflict with a printable directory's own `defaultQueryConfig`.
 *
 * Returns `false` when the directory has no default location at all — there
 * is nothing to override in that case, so it isn't treated as a conflict.
 */
export function getLocationConflict(
  defaultQueryConfig:
    PrintableDirectoryDefaultQueryConfigDto | null | undefined,
  queryParams: Record<string, unknown>,
): boolean {
  if (!defaultQueryConfig) {
    return false;
  }

  const defaultCoords = defaultQueryConfig.coords;
  const queryCoords = parseCoordsParam(queryParams.coords);

  if (
    defaultCoords?.latitude != null &&
    defaultCoords?.longitude != null &&
    queryCoords
  ) {
    const sameLatitude =
      Math.abs(queryCoords.latitude - defaultCoords.latitude) <
      COORDINATE_EPSILON_DEGREES;
    const sameLongitude =
      Math.abs(queryCoords.longitude - defaultCoords.longitude) <
      COORDINATE_EPSILON_DEGREES;

    return !(sameLatitude && sameLongitude);
  }

  const defaultLocationName = defaultQueryConfig.locationName
    ?.trim()
    .toLowerCase();
  const queryLocationName =
    typeof queryParams.location === 'string'
      ? queryParams.location.trim().toLowerCase()
      : undefined;

  if (defaultLocationName && queryLocationName) {
    return defaultLocationName !== queryLocationName;
  }

  return false;
}
