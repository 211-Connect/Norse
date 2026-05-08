import { GeocodeResult } from '@/types/resource';
import { deleteCookie, setCookie } from 'cookies-next/client';

import {
  USER_PREF_COORDS,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_LOCATION,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
} from './constants';

const COOKIE_OPTIONS = { path: '/' } as const;

/**
 * All cookie keys that together represent a saved location preference.
 * Treated as an atomic unit: either all are set or all are cleared.
 */
const LOCATION_COOKIE_KEYS = [
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
] as const;

export function clearLocationCookies() {
  for (const key of LOCATION_COOKIE_KEYS) {
    deleteCookie(key, COOKIE_OPTIONS);
  }
}

export function setLocationCookies(address: string, result: GeocodeResult) {
  setCookie(USER_PREF_COORDS, result.coordinates.join(','), COOKIE_OPTIONS);
  setCookie(USER_PREF_LOCATION, address, COOKIE_OPTIONS);
  if (result.country)
    setCookie(USER_PREF_COUNTRY, result.country, COOKIE_OPTIONS);
  if (result.district)
    setCookie(USER_PREF_DISTRICT, result.district, COOKIE_OPTIONS);
  if (result.place) setCookie(USER_PREF_PLACE, result.place, COOKIE_OPTIONS);
  if (result.postcode)
    setCookie(USER_PREF_POSTCODE, result.postcode, COOKIE_OPTIONS);
  if (result.region) setCookie(USER_PREF_REGION, result.region, COOKIE_OPTIONS);
}
