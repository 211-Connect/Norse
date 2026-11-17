import { useQuery } from '@tanstack/react-query';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { type RegionArea } from '@/app/(app)/shared/services/region-area-service';
import { isRegionId } from '@/types/areaSearch';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The outline of the area a search is filtered to, for the map. Null without
 * a Region, while loading and when it fails: the map then frames the results.
 */
export function useRegionArea(
  regionId: string | null | undefined,
  locale: string,
) {
  const enabled = isRegionId(regionId);
  const { data } = useQuery({
    queryKey: ['region-area', regionId],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ id: regionId!, locale });
      const response = await fetch(
        withOptionalCustomBasePath(`/api/region-area?${params}`),
        { signal },
      );

      if (!response.ok) {
        throw new Error(`Region area failed with ${response.status}`);
      }

      return (await response.json()) as RegionArea;
    },
    enabled,
    staleTime: ONE_DAY_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return enabled ? (data ?? null) : null;
}
