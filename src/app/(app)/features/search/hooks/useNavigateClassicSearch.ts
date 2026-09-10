import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { persistSearchDistancePreference } from '@/app/(app)/shared/lib/search-distance-preference';
import {
  trackUmamiEvent,
  UmamiEvent,
  ResourceEntry,
} from '@/app/(app)/shared/lib/umami';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
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

        const hasCoordinates = search.searchCoordinates.length === 2;
        const locationParams = hasCoordinates
          ? {
              searchLocation: search.searchLocation,
              searchCoordinates: search.searchCoordinates,
            }
          : {};

        const url = buildSearchUrl({
          ...search,
          query,
          searchEngine: appConfig.search.searchEngine,
        });
        persistSearchDistancePreference(distance);

        // Only present on the current URL for the user's first search
        // action after landing on a campaign link; buildSearchUrl never
        // carries utm_source forward into subsequent navigations.
        const utmSource = searchParams.get('utm_source');

        const umamiPayload = {
          query: String(query ?? ''),
          queryLabel: String(search.queryLabel ?? ''),
          tenantId: appConfig.tenantId ?? '',
          ...locationPayload,
          ...(utmSource ? { utm_source: utmSource } : {}),
        };

        if (search.queryType === 'taxonomy') {
          trackUmamiEvent(
            UmamiEvent.SearchTaxonomy,
            umamiPayload,
            appConfig.sessionId,
          );
        } else if (search.queryType === 'hybrid') {
          trackUmamiEvent(
            UmamiEvent.SearchHybrid,
            umamiPayload,
            appConfig.sessionId,
          );
        } else {
          trackUmamiEvent(
            UmamiEvent.SearchText,
            umamiPayload,
            appConfig.sessionId,
          );
        }

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
