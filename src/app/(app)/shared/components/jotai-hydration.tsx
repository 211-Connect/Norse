'use client';

import { deleteCookie, setCookie } from 'cookies-next';
import { useEffect, useMemo } from 'react';

import { useHydrateAndSyncAtoms } from '@/app/(app)/shared/hooks/use-hydrate-and-sync-atoms';
import {
  filtersAtom,
  resultTotalAtom,
  resultsAtom,
  resultsCurrentPageAtom,
} from '@/app/(app)/shared/store/results';
import { searchAtom } from '@/app/(app)/shared/store/search';

import { useAppConfig } from '../hooks/use-app-config';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_FONT_SIZE,
  USER_PREF_LOCATION,
} from '../lib/constants';
import { validateCoordsString } from '../lib/validators';
import { accessibilityAtom } from '../store/accessibility';
import { deviceAtom } from '../store/device';
import {
  favoriteListWithFavoritesAtom,
  favoriteListsStateAtom,
} from '../store/favorites';

function getCoordinates(pageProps, cookies) {
  if (pageProps.coords) {
    const coords = decodeURIComponent(pageProps.coords)
      .split(',')
      .map((number) => Number.parseFloat(number))
      .filter((number) => !Number.isNaN(number));
    return coords;
  } else if (cookies[USER_PREF_COORDS]) {
    const hasValidCoords = validateCoordsString(cookies[USER_PREF_COORDS]);
    if (!hasValidCoords) {
      return [];
    }

    return cookies[USER_PREF_COORDS].split(',')
      .map((number) => Number.parseFloat(number))
      .filter((number) => !Number.isNaN(number));
  }

  return [];
}

function getSearchLocation(pageProps, cookies) {
  if (pageProps.location) {
    return decodeURIComponent(pageProps.location);
  } else if (cookies[USER_PREF_LOCATION]) {
    return cookies[USER_PREF_LOCATION];
  }

  return '';
}

// This component handles the hydration of Jotai state as well as keeping it in sync with re-renders/fetches of new data
// This MUST be a child of the Jotai Provider component or hydration will not work
export function JotaiHydration({ cookies = {}, pageProps }) {
  const appConfig = useAppConfig();

  // Stable primitives derived from props — used as useMemo dependencies
  const coordsKey = pageProps?.coords ?? cookies?.[USER_PREF_COORDS] ?? '';
  const locationKey =
    pageProps?.location ?? cookies?.[USER_PREF_LOCATION] ?? '';
  const preferredDistance =
    pageProps?.distance?.trim() ||
    cookies?.[USER_PREF_DISTANCE]?.trim() ||
    appConfig?.search?.defaultRadius?.toString()?.trim() ||
    '0';

  // Run cookie side-effects once when the source values change, not on every render
  useEffect(() => {
    if (pageProps?.coords) {
      const coords = getCoordinates(pageProps, cookies);
      if (coords.length)
        setCookie(USER_PREF_COORDS, coords.join(','), { path: '/' });
    } else if (
      cookies[USER_PREF_COORDS] &&
      !validateCoordsString(cookies[USER_PREF_COORDS])
    ) {
      deleteCookie(USER_PREF_COORDS, { path: '/' });
    }
  }, [cookies, coordsKey, pageProps]);

  useEffect(() => {
    if (pageProps?.location) {
      setCookie(USER_PREF_LOCATION, decodeURIComponent(pageProps.location), {
        path: '/',
      });
    }
  }, [locationKey, pageProps.location]);

  // Stable atom values — only recomputed when actual input values change
  const atomValues = useMemo(
    () =>
      [
        [
          accessibilityAtom,
          { fontSize: cookies[USER_PREF_FONT_SIZE] || '1rem' },
        ],
        [
          deviceAtom,
          pageProps?.device ?? {
            isMobile: false,
            isTablet: false,
            isDesktop: false,
          },
        ],
        [resultsAtom, pageProps?.results ?? null],
        [resultsCurrentPageAtom, pageProps?.currentPage ?? 0],
        [resultTotalAtom, pageProps?.totalResults ?? 0],
        [filtersAtom, pageProps?.filters ?? {}],
        [
          favoriteListsStateAtom,
          {
            data: pageProps?.favoriteLists ?? [],
            totalCount: pageProps?.favoriteListsTotal ?? 0,
            currentPage: pageProps?.favoriteListsCurrentPage ?? 1,
            limit: 10,
            status: 'success',
          },
        ],
        [
          favoriteListWithFavoritesAtom,
          {
            ...pageProps?.favoriteList,
            viewingAsOwner: pageProps?.viewingAsOwner ?? false,
          },
        ],
        [
          searchAtom,
          {
            searchTerm: pageProps?.query_label ?? '',
            query: pageProps?.query ?? '',
            queryLabel: pageProps?.query_label ?? '',
            queryType: pageProps?.query_type ?? '',
            searchDistance: preferredDistance,
            searchLocation: getSearchLocation(pageProps, cookies),
            prevSearchLocation: getSearchLocation(pageProps, cookies),
            searchLocationValidationError: '',
            searchCoordinates: getCoordinates(pageProps, cookies),
          },
        ],
      ] as const,
    [cookies, pageProps, preferredDistance],
  );

  useHydrateAndSyncAtoms(atomValues);

  return <></>;
}
