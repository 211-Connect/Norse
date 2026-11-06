import { useQuery } from '@tanstack/react-query';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

import { type SearchPin } from '../utils/map-pins';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Every result's map pin for a search, keyed by its page-independent query,
 * so turning a page of the list reuses the pins already loaded. Null until
 * they arrive, and when they fail: the map then shows the page's own results.
 *
 * @param pinsQuery  From `toPinsQuery`, or null when the map shows the page only.
 */
export function useSearchPins(pinsQuery: string | null) {
  const { data, isFetching } = useQuery({
    queryKey: ['search-pins', pinsQuery],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        withOptionalCustomBasePath(`/api/search-pins?${pinsQuery}`),
        { signal },
      );

      if (!response.ok) {
        throw new Error(`Search pins failed with ${response.status}`);
      }

      const body: { pins: SearchPin[] } = await response.json();
      return body.pins;
    },
    enabled: pinsQuery !== null,
    // Pins change on a reindex, not while someone reads a search.
    staleTime: ONE_HOUR_MS,
    // A few searches' pins, not a session's worth: each can be 10,000 of them.
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    pins: data ?? null,
    isLoading: pinsQuery !== null && isFetching && !data,
  };
}
