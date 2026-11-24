import { deleteCookie, setCookie } from 'cookies-next/client';

import { GeocodeResult } from '@/types/resource';

import {
  USER_PREF_COORDS,
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_LOCATION,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
  USER_PREF_REGION_ID,
} from './constants';

function setOptionalLocationCookie(name: string, value?: string | null) {
  if (value?.trim()) {
    setCookie(name, value, COOKIE_OPTIONS);
  } else {
    deleteCookie(name, COOKIE_OPTIONS);
  }
}

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
  USER_PREF_REGION_ID,
] as const;

export function clearLocationCookies() {
  for (const key of LOCATION_COOKIE_KEYS) {
    deleteCookie(key, COOKIE_OPTIONS);
  }
}

export function setLocationCookies(address: string, result: GeocodeResult) {
  setCookie(USER_PREF_COORDS, result.coordinates.join(','), COOKIE_OPTIONS);
  setCookie(USER_PREF_LOCATION, address, COOKIE_OPTIONS);
  setOptionalLocationCookie(USER_PREF_COUNTRY, result.country);
  setOptionalLocationCookie(USER_PREF_DISTRICT, result.district);
  setOptionalLocationCookie(USER_PREF_PLACE, result.place);
  setOptionalLocationCookie(USER_PREF_POSTCODE, result.postcode);
  setOptionalLocationCookie(USER_PREF_REGION, result.region);
  setOptionalLocationCookie(USER_PREF_REGION_ID, result.region_id);
}
