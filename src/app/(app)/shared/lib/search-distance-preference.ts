import { deleteCookie, setCookie } from 'cookies-next/client';

import { USER_PREF_DISTANCE } from './constants';

export function persistSearchDistancePreference(value: string) {
  if (value === '0') {
    deleteCookie(USER_PREF_DISTANCE, { path: '/' });
    return;
  }

  setCookie(USER_PREF_DISTANCE, value, { path: '/' });
}
