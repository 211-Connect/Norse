import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Coords = [number, number]; // [longitude, latitude]

/**
 *
 * @param coords1
 * @param coords2
 * @see https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
 * @returns
 */
export function distanceBetweenCoordsInKm(coords1: Coords, coords2: Coords) {
  const M = 0.621371; // Miles in a kilometer

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coords2[1] - coords1[1]); // deg2rad below
  const dLon = deg2rad(coords2[0] - coords1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1[1])) *
      Math.cos(deg2rad(coords2[1])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function stringToBooleanOrUndefined(str?: string): boolean | undefined {
  if (str == null || str.trim().length === 0) return;
  return str.toLowerCase() === 'true';
}

export function getGoogleMapsDestinationUrl(
  originCoords: number[],
  destinationCoords: number[],
) {
  const getOrigin = () => {
    if (originCoords) {
      return originCoords?.slice()?.reverse()?.join(',');
    }

    return '';
  };

  const getDestination = () => {
    if (destinationCoords) {
      return destinationCoords?.slice()?.reverse()?.join(',');
    }

    return '';
  };

  if (!getOrigin()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${getDestination()}`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&origin=${getOrigin()}&destination=${getDestination()}`;
  }
}

/**
 * Validates and parses coords query parameter.
 * Returns [lng, lat] tuple if valid, null otherwise.
 * Handles malformed coords like duplicated values or corrupted strings.
 *
 * @param coords - The coords string from query params
 * @param options.attemptExtract - If true, attempts to extract the first valid [lng, lat] pair
 *                                  from malformed coords (e.g., duplicated values). Default: true
 */
export function parseAndValidateCoords(
  coords: string | string[] | undefined,
  options: { attemptExtract?: boolean } = {},
): [number, number] | null {
  const { attemptExtract = true } = options;

  if (!coords) return null;

  const coordString = Array.isArray(coords) ? coords[0] : coords;
  const parts = coordString.split(',').map((p) => parseFloat(p.trim()));

  // Ideal case: exactly 2 values
  if (parts.length === 2) {
    const [lng, lat] = parts;
    if (!isNaN(lng) && !isNaN(lat) && isValidCoordRange(lng, lat)) {
      return [lng, lat];
    }
    console.warn(`Invalid coords (NaN or out of range): ${coordString}`);
    return null;
  }

  // Malformed: wrong number of values
  if (parts.length !== 2) {
    console.warn(
      `Invalid coords format (expected 2 values, got ${parts.length}): ${coordString}`,
    );

    // Attempt to extract first valid pair if enabled
    if (attemptExtract && parts.length >= 2) {
      const extracted = extractFirstValidCoordPair(parts);
      if (extracted) {
        console.log(
          `Extracted valid coords [${extracted[0]}, ${extracted[1]}] from malformed input`,
        );
        return extracted;
      }
    }

    return null;
  }

  return null;
}

/**
 * Checks if longitude and latitude are within valid ranges.
 */
function isValidCoordRange(lng: number, lat: number): boolean {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/**
 * Attempts to extract the first valid [lng, lat] pair from an array of numbers.
 * Useful for handling duplicated coords like [-76.6, 39.3, -76.6, 39.3].
 */
function extractFirstValidCoordPair(parts: number[]): [number, number] | null {
  for (let i = 0; i < parts.length - 1; i++) {
    const lng = parts[i];
    const lat = parts[i + 1];

    if (!isNaN(lng) && !isNaN(lat) && isValidCoordRange(lng, lat)) {
      return [lng, lat];
    }
  }
  return null;
}

/**
 * Cleans duplicated values from location string.
 * Handles cases like "21201, Maryland, United States,21201, Maryland, United States"
 */
export function cleanLocationString(
  location: string | string[] | undefined,
): string | null {
  if (!location) return null;

  const locationStr = Array.isArray(location) ? location[0] : location;
  const parts = locationStr.split(',');
  const uniqueParts = [...new Set(parts.map((p) => p.trim()))];
  return uniqueParts.join(', ');
}
