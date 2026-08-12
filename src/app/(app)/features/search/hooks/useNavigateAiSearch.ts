import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { persistSearchDistancePreference } from '@/app/(app)/shared/lib/search-distance-preference';
import { ResourceEntry } from '@/app/(app)/shared/lib/umami';
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

      const url = buildSearchUrl({
        aiScenario: scenario,
        query,
        queryLabel: search.queryLabel,
        taxonomies,
        searchEngine: appConfig.search.searchEngine,
        skipLegacyLinkCheck: true,
      });

      persistSearchDistancePreference(distance);
      startTransition(() => {
        setDialogOpen?.(false);
        setSearchEntry(ResourceEntry.SearchCard);
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
      appConfig.search.searchEngine,
      setDialogOpen,
      setSearchEntry,
      startTransition,
    ],
  );
};
