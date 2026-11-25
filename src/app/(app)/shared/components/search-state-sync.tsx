'use client';

import { deleteCookie, setCookie } from 'cookies-next';
import { useEffect, useMemo } from 'react';

import { useHydrateAndSyncAtoms } from '../hooks/use-hydrate-and-sync-atoms';
import { useAppConfig } from '../hooks/use-app-config';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTRICT,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION_ID,
} from '../lib/constants';
import { isRegionId } from '@/types/areaSearch';
import { searchTermFromUrl } from '../lib/search-term-from-url';
import { validateCoordsString } from '../lib/validators';
import { DEFAULT_SEARCH_STATE, searchAtom } from '../store/search';
import type { SearchLocationGeocode, SearchState } from '../store/search';

/** Search parameters of the current URL, as parsed by the page. */
export interface PageSearchState {
  query?: string;
  queryLabel?: string;
  queryType?: string;
  location?: string;
  /** Comma-separated `lng,lat`. */
  coords?: string;
  /** The area searched, when the location is one (docs/area-search.md). */
  region?: string;
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
  const urlRegion = search?.region ?? '';
  const cookieRegion = cookies[USER_PREF_REGION_ID] ?? '';
  const distance =
    search?.distance?.trim() ||
    cookies[USER_PREF_DISTANCE]?.trim() ||
    appConfig?.search?.defaultRadius?.toString()?.trim() ||
    '0';

  const location = urlLocation
    ? decodeURIComponent(urlLocation)
    : cookieLocation;

  // The region belongs to the location it came with: the URL's, else the saved one.
  const region = urlLocation
    ? urlRegion
    : isRegionId(cookieRegion)
      ? cookieRegion
      : '';

  const coords = urlCoords
    ? decodeURIComponent(urlCoords)
    : validateCoordsString(cookieCoords)
      ? cookieCoords
      : '';
  const searchLocationGeocode = useMemo<SearchLocationGeocode | null>(() => {
    const currentCoordinates = coords ? parseCoords(coords) : [];
    const savedCoordinates = cookieCoords ? parseCoords(cookieCoords) : [];
    if (
      currentCoordinates.length !== 2 ||
      savedCoordinates.length !== 2 ||
      currentCoordinates.some(
        (coordinate, index) => coordinate !== savedCoordinates[index],
      ) ||
      region !== cookieRegion
    ) {
      return null;
    }

    return {
      coordinates: savedCoordinates,
      place: cookies[USER_PREF_PLACE] || undefined,
      postcode: cookies[USER_PREF_POSTCODE] || undefined,
      district: cookies[USER_PREF_DISTRICT] || undefined,
    };
  }, [
    coords,
    cookieCoords,
    region,
    cookieRegion,
    cookies[USER_PREF_PLACE],
    cookies[USER_PREF_POSTCODE],
    cookies[USER_PREF_DISTRICT],
  ]);

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
      if (urlRegion) {
        setCookie(USER_PREF_REGION_ID, urlRegion, { path: '/' });
      } else {
        deleteCookie(USER_PREF_REGION_ID, { path: '/' });
      }
    }
  }, [urlLocation, urlRegion]);

  const atomValues = useMemo(
    () =>
      [
        [
          searchAtom,
          {
            ...DEFAULT_SEARCH_STATE,
            // v2 only: a link with `query` and no `query_label` shows its words (v1 shows the label only).
            searchTerm: searchTermFromUrl({
              query,
              queryLabel,
              queryType,
              v2: appConfig.featureFlags.enableV2Api,
            }),
            query,
            queryLabel,
            queryType,
            searchDistance: distance,
            searchLocation: location,
            prevSearchLocation: location,
            searchCoordinates: coords ? parseCoords(coords) : [],
            searchLocationGeocode,
            searchRegion: region,
          } satisfies SearchState,
        ],
      ] as const,
    [
      appConfig.featureFlags.enableV2Api,
      coords,
      distance,
      location,
      query,
      queryLabel,
      queryType,
      region,
      searchLocationGeocode,
    ],
  );

  useHydrateAndSyncAtoms(atomValues);

  return null;
}
