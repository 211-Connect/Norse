import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Address } from '@/types/resource';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withOptionalTrailingSlash(path: string): string {
  if (process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES !== 'true') {
    return path;
  }

  const hashIndex = path.indexOf('#');
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';

  const queryIndex = pathWithoutHash.indexOf('?');
  const pathname =
    queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const query = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex) : '';

  if (!pathname || pathname === '/' || pathname.endsWith('/')) {
    return `${pathname || '/'}${query}${hash}`;
  }

  return `${pathname}/${query}${hash}`;
}

export function withOptionalCustomBasePath(path: string): string {
  const configuredBasePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH;
  const normalizedBasePath = configuredBasePath
    ? `/${configuredBasePath.replace(/^\/+|\/+$/g, '')}`
    : '';

  if (!normalizedBasePath) {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (
        url.pathname === normalizedBasePath ||
        url.pathname.startsWith(`${normalizedBasePath}/`)
      ) {
        return url.toString();
      }

      url.pathname =
        url.pathname === '/'
          ? normalizedBasePath
          : url.pathname.startsWith('/')
            ? `${normalizedBasePath}${url.pathname}`
            : `${normalizedBasePath}/${url.pathname}`;

      return url.toString();
    } catch {
      return path;
    }
  }

  const hashIndex = path.indexOf('#');
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';

  const queryIndex = pathWithoutHash.indexOf('?');
  const pathname =
    queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const query = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex) : '';

  if (
    pathname === normalizedBasePath ||
    pathname.startsWith(`${normalizedBasePath}/`)
  ) {
    return `${pathname}${query}${hash}`;
  }

  if (!pathname) {
    return `${normalizedBasePath}${query}${hash}`;
  }

  if (!pathname.startsWith('/')) {
    return `${normalizedBasePath}/${pathname}${query}${hash}`;
  }

  return `${normalizedBasePath}${pathname}${query}${hash}`;
}

export type Coords = [number, number]; // [longitude, latitude]

/**
 * Calculates the distance between two coordinate pairs using the Haversine formula.
 * @see https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
 */
export function distanceBetweenCoordsInKm(coords1: Coords, coords2: Coords) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coords2[1] - coords1[1]);
  const dLon = deg2rad(coords2[0] - coords1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1[1])) *
      Math.cos(deg2rad(coords2[1])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const KM_TO_MILES = 0.621371;

export function distanceBetweenCoordsInMiles(coords1: Coords, coords2: Coords) {
  return distanceBetweenCoordsInKm(coords1, coords2) * KM_TO_MILES;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function stringToBooleanOrUndefined(str?: string): boolean | undefined {
  if (str == null || str.trim().length === 0) return;
  return str.toLowerCase() === 'true';
}

export function getGoogleMapsDestinationUrl(
  originCoords: number[] | undefined | null,
  destinationCoords: number[] | undefined | null,
) {
  const origin = originCoords?.slice()?.reverse()?.join(',') ?? '';
  const destination = destinationCoords?.slice()?.reverse()?.join(',') ?? '';

  if (!origin) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
}

export function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;

  const element = document.documentElement;
  const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
  const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

  if (!hasVerticalScrollbar && !hasHorizontalScrollbar) return 0;

  const scrollDiv = document.createElement('div');
  scrollDiv.style.cssText =
    'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px';

  document.body.appendChild(scrollDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
}

const isValidPart = (part: string | undefined | null): part is string => {
  return Boolean(part && part !== 'null' && part.trim() !== '');
};

const withHardSpaces = (value: string) =>
  value.trim().replace(/\s+/g, '\u00A0');

export function formatAddressForDisplay(
  address: Partial<Address> | undefined | null,
): string {
  if (!address) return '';

  const city = isValidPart(address.city) ? withHardSpaces(address.city) : '';
  const state = 'state' in address ? address.state : address.stateProvince;
  const postalCode =
    'postal_code' in address ? address.postal_code : address.postalCode;
  const statePostal = [state, postalCode]
    .filter(isValidPart)
    .map((part) => withHardSpaces(part))
    .join('\u00A0');

  return [address.address_1, address.address_2, city, statePostal]
    .filter(isValidPart)
    .join(', ');
}
