import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  ResourceEntry,
  trackSearchEvent,
} from '@/app/(app)/shared/lib/analytics';
import { deriveQueryType } from '@/app/(app)/shared/lib/search-utils';
import { persistSearchDistancePreference } from '@/app/(app)/shared/lib/search-distance-preference';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { buildSearchUrl } from '../utils/buildSearchUrl';
import {
  searchAtom,
  searchDistanceAtom,
  searchEntryAtom,
} from '@/app/(app)/shared/store/search';
import { useAtomValue, useSetAtom } from 'jotai';
import { AiClassificationScenario } from '@/app/(app)/shared/services/ai-classification-search-service';

type Args = {
  setDialogOpen?: (open: boolean) => void;
  startTransition: (callback: () => void) => void;
};

export const useNavigateAiSearch = ({
  setDialogOpen,
  startTransition,
}: Args) => {
  const appConfig = useAppConfig();
  const router = useRouter();
  const search = useAtomValue(searchAtom);
  const distance = useAtomValue(searchDistanceAtom);
  const setSearchEntry = useSetAtom(searchEntryAtom);

  return useCallback(
    ({
      scenario,
      taxonomies,
    }: {
      scenario?: AiClassificationScenario;
      taxonomies?: string[];
    } = {}) => {
      const query = (search.query || search.searchTerm || '').trim();
      if (!query) {
        return false;
      }

      const queryType = deriveQueryType({
        searchEngine: appConfig.search.searchEngine,
        originQueryType: undefined,
        query,
      });

      const url = buildSearchUrl({
        aiScenario: scenario,
        query,
        queryLabel: search.queryLabel,
        taxonomies,
        location: search.searchLocation,
        coordinates: search.searchCoordinates,
        distance: search.searchDistance,
        searchEngine: appConfig.search.searchEngine,
        skipLegacyLinkCheck: true,
      });

      persistSearchDistancePreference(distance);
      startTransition(() => {
        setDialogOpen?.(false);
        setSearchEntry(ResourceEntry.SearchCard);
        trackSearchEvent(
          queryType,
          {
            query,
            queryLabel: String(search.queryLabel ?? ''),
            tenantId: appConfig.tenantId ?? '',
          },
          appConfig.sessionId,
        );
        router.push(url);
      });

      return true;
    },
    [
      distance,
      router,
      search.query,
      search.queryLabel,
      search.searchTerm,
      search.searchLocation,
      search.searchCoordinates,
      search.searchDistance,
      appConfig.search.searchEngine,
      appConfig.sessionId,
      appConfig.tenantId,
      setDialogOpen,
      setSearchEntry,
      startTransition,
    ],
  );
};
