import { useEffect, useMemo, useState } from 'react';

import { getResources } from '@/app/(app)/shared/services/resource-service';
import { Resource } from '@/types/resource';

import { useLocalFavorites } from './use-local-favorites';

const MAX_LOCAL_FAVORITES_FETCH = 100;

type UseLocalFavoriteResourcesOptions = {
  locale: string;
  tenantId?: string;
};

export function useLocalFavoriteResources({
  locale,
  tenantId,
}: UseLocalFavoriteResourcesOptions) {
  const { localFavoriteIds, isLocalFavorite, hydrated } = useLocalFavorites();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch resources whenever the stored IDs change
  useEffect(() => {
    // Wait for hydration to avoid fetching with empty array
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      // Cap IDs to prevent unbounded API work
      const cappedIds = localFavoriteIds.slice(0, MAX_LOCAL_FAVORITES_FETCH);
      const fetched = await getResources(cappedIds, locale, tenantId);
      if (!cancelled) {
        setResources(fetched);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [hydrated, localFavoriteIds.join(','), locale, tenantId]);

  // Filter to only include resources that are still in local favorites
  const localFavoriteResources = useMemo(
    () => resources.filter((resource) => isLocalFavorite(resource.id)),
    [resources, isLocalFavorite],
  );

  return {
    resources: localFavoriteResources,
    allResources: resources,
    loading,
    setResources,
  };
}
