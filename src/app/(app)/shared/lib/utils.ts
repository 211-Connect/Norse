import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Address } from '@/types/resource';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Coords = [number, number]; // [longitude, latitude]

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

export function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;

  const element = document.documentElement;
  const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
  const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

  if (!hasVerticalScrollbar && !hasHorizontalScrollbar) return 0;

  // dynamiczny pomiar (potencjalna szerokość scrollbara)
  const scrollDiv = document.createElement('div');
  scrollDiv.style.width = '100px';
  scrollDiv.style.height = '100px';
  scrollDiv.style.overflow = 'scroll';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';

  document.body.appendChild(scrollDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
}

export function formatAddressForDisplay(
  address: Partial<Address> | undefined | null,
): string {
  if (!address) return '';

  const isValidPart = (part: string | undefined | null) => {
    return (
      part &&
      part !== 'null' &&
      part.trim() !== ''
    );
  };

  return [
    address.address_1,
    address.address_2,
    address.city,
    [address.stateProvince, address.postalCode].filter(isValidPart).join(' '),
  ]
    .filter(isValidPart)
    .join(', ');
}
