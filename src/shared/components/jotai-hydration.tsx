import {
  resultsAtom,
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useHydrateAndSyncAtoms } from '@/shared/hooks/use-hydrate-and-sync-atoms';
import { searchAtom } from '@/shared/store/search';
import { useAppConfig } from '../hooks/use-app-config';

// This component handles the hydration of Jotai state as well as keeping it in sync with re-renders/fetches of new data
// This MUST be a child of the Jotai Provider component or hydration will not work
export function JotaiHydration({ pageProps }) {
  const appConfig = useAppConfig();

  useHydrateAndSyncAtoms([
    [resultsAtom, pageProps?.results ?? []],
    [resultsCurrentPageAtom, pageProps?.currentPage ?? 0],
    [resultTotalAtom, pageProps?.totalResults ?? 0],
    [
      searchAtom,
      {
        searchTerm: pageProps?.query_label ?? '',
        query: pageProps?.query ?? '',
        queryLabel: pageProps?.query_label,
        searchDistance:
          pageProps?.distance ??
          appConfig?.search?.defaultRadius?.toString() ??
          '0',
        searchLocation: pageProps?.location,
        userLocation: pageProps?.location,
        userCoordinates: pageProps?.coords?.split(','),
      },
    ],
  ] as const);

  return <></>;
}
