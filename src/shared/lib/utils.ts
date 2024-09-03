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
export function distanceBetweenCoordsInMiles(coords1: Coords, coords2: Coords) {
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
  return Math.round(d * M);
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function stringToBooleanOrUndefined(str?: string): boolean | undefined {
  if (str == null || str.trim().length === 0) return;
  return str.toLowerCase() === 'true';
}
