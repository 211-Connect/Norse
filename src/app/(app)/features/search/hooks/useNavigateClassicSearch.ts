import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { persistSearchDistancePreference } from '@/app/(app)/shared/lib/search-distance-preference';
import { trackUmamiEvent, UmamiEvent } from '@/app/(app)/shared/lib/umami';
import { useRouter } from 'next/navigation';
import { useCallback, startTransition } from 'react';
import { buildSearchUrl } from '../utils/buildSearchUrl';
import {
  searchAtom,
  searchDistanceAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue, useSetAtom } from 'jotai';

type Args = {
  setDialogOpen?: (open: boolean) => void;
};
export const useNavigateClassicSearch = ({ setDialogOpen }: Args) => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);
  const distance = useAtomValue(searchDistanceAtom);

  return useCallback(
    async (locationPayload: Record<string, unknown>) => {
      startTransition(() => {
        const query = search.query || search.searchTerm;

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

        const umamiPayload = {
          query: String(query ?? ''),
          queryLabel: String(search.queryLabel ?? ''),
          tenantId: appConfig.tenantId ?? '',
          ...locationPayload,
        };

        if (search.queryType === 'taxonomy') {
          trackUmamiEvent(UmamiEvent.SearchTaxonomy, umamiPayload);
        } else {
          trackUmamiEvent(UmamiEvent.SearchText, umamiPayload);
        }

        setDialogOpen?.(false);
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
      setDialogOpen,
      setSearch,
      startTransition,
    ],
  );
};
