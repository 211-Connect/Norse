import {
  filtersAtom,
  noResultsAtom,
  resultsAtom,
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useHydrateAndSyncAtoms } from '@/shared/hooks/use-hydrate-and-sync-atoms';
import { searchAtom } from '@/shared/store/search';
import { useAppConfig } from '../hooks/use-app-config';
import { parseCookies } from 'nookies';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
} from '../lib/constants';
import {
  favoriteListsAtom,
  favoriteListWithFavoritesAtom,
} from '../store/favorites';

// This component handles the hydration of Jotai state as well as keeping it in sync with re-renders/fetches of new data
// This MUST be a child of the Jotai Provider component or hydration will not work
export function JotaiHydration({ pageProps }) {
  const appConfig = useAppConfig();
  const cookies = parseCookies();

  useHydrateAndSyncAtoms([
    [resultsAtom, pageProps?.results ?? []],
    [resultsCurrentPageAtom, pageProps?.currentPage ?? 0],
    [resultTotalAtom, pageProps?.totalResults ?? 0],
    [filtersAtom, pageProps?.filters ?? {}],
    [favoriteListsAtom, pageProps?.favoriteLists ?? []],
    [
      favoriteListWithFavoritesAtom,
      {
        ...pageProps?.favoriteList,
        viewingAsOwner: pageProps?.viewingAsOwner ?? false,
      },
    ],
    [noResultsAtom, pageProps?.noResults ?? false],
    [
      searchAtom,
      {
        searchTerm: pageProps?.query_label ?? '',
        query: pageProps?.query ?? '',
        queryLabel: pageProps?.query_label ?? '',
        searchDistance:
          pageProps?.distance ??
          cookies?.[USER_PREF_DISTANCE] ??
          appConfig?.search?.defaultRadius?.toString() ??
          '0',
        searchLocation:
          pageProps?.location ?? cookies?.[USER_PREF_LOCATION] ?? '',
        searchLocationValidationError: '',
        userLocation: pageProps?.location,
        userCoordinates:
          decodeURIComponent(pageProps?.coords)
            ?.split(',')
            ?.map((number) => parseFloat(number))
            ?.filter((number) => !isNaN(number)) ??
          cookies?.[USER_PREF_COORDS]?.split(',')
            ?.map((number) => parseFloat(number))
            ?.filter((number) => !isNaN(number)) ??
          [],
      },
    ],
  ] as const);

  return <></>;
}
