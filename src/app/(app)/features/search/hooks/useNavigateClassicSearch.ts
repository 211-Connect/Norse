import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  ResourceEntry,
  trackSearchEvent,
} from '@/app/(app)/shared/lib/analytics';
import { deriveQueryType } from '@/app/(app)/shared/lib/search-utils';
import { persistSearchDistancePreference } from '@/app/(app)/shared/lib/search-distance-preference';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { withPrintableDirectoryContext } from '@/app/(app)/shared/utils/printableDirectorySearchContext';
import { buildSearchUrl } from '../utils/buildSearchUrl';
import {
  searchAtom,
  searchDistanceAtom,
  searchEntryAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue, useSetAtom } from 'jotai';

type Args = {
  setDialogOpen?: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
};
export const useNavigateClassicSearch = ({
  setDialogOpen,
  startTransition,
}: Args) => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);
  const setSearchEntry = useSetAtom(searchEntryAtom);
  const distance = useAtomValue(searchDistanceAtom);

  return useCallback(
    async (locationPayload: Record<string, unknown>) => {
      startTransition(() => {
        // When an organization is selected, keep the query empty (terminal
        // "show this org's resources" scope) instead of falling back to the
        // org name in searchTerm, which would add an unintended text match.
        const query = search.organizationId
          ? search.query
          : search.query || search.searchTerm;

        const queryType = deriveQueryType({
          searchEngine: appConfig.search.searchEngine,
          originQueryType: search.queryType,
          query,
        });
        const hasCoordinates = search.searchCoordinates.length === 2;
        // Persisted back into the atom after navigation below — unrelated to
        // the URL itself, which buildSearchUrl derives from the explicit
        // location/coordinates/distance args passed in below.
        const locationParams = hasCoordinates
          ? {
              searchLocation: search.searchLocation,
              searchCoordinates: search.searchCoordinates,
              searchRegion: search.searchRegion,
            }
          : {};

        const url = withPrintableDirectoryContext(
          buildSearchUrl({
            ...search,
            query,
            location: search.searchLocation,
            coordinates: search.searchCoordinates,
            region: search.searchRegion,
            distance: search.searchDistance,
            searchEngine: appConfig.search.searchEngine,
          }),
          searchParams,
        );
        persistSearchDistancePreference(distance);

        // Only present on the current URL for the user's first search
        // action after landing on a campaign link; buildSearchUrl never
        // carries utm_source forward into subsequent navigations.
        const utmSource = searchParams?.get('utm_source');

        const umamiPayload = {
          query: String(query ?? ''),
          queryLabel: String(search.queryLabel ?? ''),
          tenantId: appConfig.tenantId ?? '',
          ...locationPayload,
          ...(utmSource ? { utm_source: utmSource } : {}),
        };

        trackSearchEvent(queryType, umamiPayload, appConfig.sessionId);

        setDialogOpen?.(false);
        setSearchEntry(ResourceEntry.SearchCard);
        router.push(url);

        setSearch((prev) => ({
          ...prev,
          ...locationParams,
        }));
      });
    },
    [
      appConfig.search.searchEngine,
      appConfig.tenantId,
      appConfig.sessionId,
      distance,
      router,
      search,
      searchParams,
      setDialogOpen,
      setSearch,
      setSearchEntry,
      startTransition,
    ],
  );
};
