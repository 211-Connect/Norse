'use client';

import { deleteCookie, setCookie } from 'cookies-next';
import { useEffect, useMemo } from 'react';

import { useHydrateAndSyncAtoms } from '../hooks/use-hydrate-and-sync-atoms';
import { useAppConfig } from '../hooks/use-app-config';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
} from '../lib/constants';
import { validateCoordsString } from '../lib/validators';
import { DEFAULT_SEARCH_STATE, SearchState, searchAtom } from '../store/search';

/** Search parameters of the current URL, as parsed by the page. */
export interface PageSearchState {
  query?: string;
  queryLabel?: string;
  queryType?: string;
  location?: string;
  /** Comma-separated `lng,lat`. */
  coords?: string;
  distance?: string;
}

interface SearchStateSyncProps {
  cookies: Partial<Record<string, string>>;
  search?: PageSearchState;
}

function parseCoords(value: string) {
  return value
    .split(',')
    .map((number) => Number.parseFloat(number))
    .filter((number) => !Number.isNaN(number));
}

/**
 * Resets the search form (`searchAtom`, rendered in the header on every page)
 * to the current URL's search, falling back to the user's saved location and
 * distance cookies. Re-syncs only when one of those inputs changes, so a
 * re-render with the same page doesn't discard what the user is typing.
 */
export function SearchStateSync({ cookies, search }: SearchStateSyncProps) {
  const appConfig = useAppConfig();

  const query = search?.query ?? '';
  const queryLabel = search?.queryLabel ?? '';
  const queryType = search?.queryType ?? '';
  const urlLocation = search?.location ?? '';
  const urlCoords = search?.coords ?? '';
  const cookieCoords = cookies[USER_PREF_COORDS] ?? '';
  const cookieLocation = cookies[USER_PREF_LOCATION] ?? '';
  const distance =
    search?.distance?.trim() ||
    cookies[USER_PREF_DISTANCE]?.trim() ||
    appConfig?.search?.defaultRadius?.toString()?.trim() ||
    '0';

  const location = urlLocation
    ? decodeURIComponent(urlLocation)
    : cookieLocation;

  const coords = urlCoords
    ? decodeURIComponent(urlCoords)
    : validateCoordsString(cookieCoords)
      ? cookieCoords
      : '';

  useEffect(() => {
    if (urlCoords) {
      const parsed = parseCoords(decodeURIComponent(urlCoords));
      if (parsed.length) {
        setCookie(USER_PREF_COORDS, parsed.join(','), { path: '/' });
      }
    } else if (cookieCoords && !validateCoordsString(cookieCoords)) {
      deleteCookie(USER_PREF_COORDS, { path: '/' });
    }
  }, [urlCoords, cookieCoords]);

  useEffect(() => {
    if (urlLocation) {
      setCookie(USER_PREF_LOCATION, decodeURIComponent(urlLocation), {
        path: '/',
      });
    }
  }, [urlLocation]);

  const atomValues = useMemo(
    () =>
      [
        [
          searchAtom,
          {
            ...DEFAULT_SEARCH_STATE,
            searchTerm: queryLabel,
            query,
            queryLabel,
            queryType,
            searchDistance: distance,
            searchLocation: location,
            prevSearchLocation: location,
            searchCoordinates: coords ? parseCoords(coords) : [],
          } satisfies SearchState,
        ],
      ] as const,
    [coords, distance, location, query, queryLabel, queryType],
  );

  useHydrateAndSyncAtoms(atomValues);

  return null;
}
