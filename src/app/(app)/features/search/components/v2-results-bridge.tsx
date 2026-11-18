'use client';

import type { PropsWithChildren } from 'react';

import {
  SearchResultsProvider,
  useSearchResults,
} from '../context/search-results-context';
import { useV2Search } from '../v2/use-v2-search';
import { v2Results } from '../v2/v2-results';

/**
 * Prototype (Lucas 2026-11-18, 3A): swaps the server-rendered v1 cards for the `/v2/search` ones once the
 * v2 answer is here, so region and area scope the list as they scope the pins. Before that, and when v2 is
 * off, the v1 values pass through unchanged.
 */
export function V2ResultsBridge({ children }: PropsWithChildren) {
  const base = useSearchResults();
  const { data } = useV2Search();
  const v2 = v2Results(data, base.results);
  return (
    <SearchResultsProvider
      value={{
        results: v2?.results ?? base.results,
        totalResults: v2?.totalResults ?? base.totalResults,
        currentPage: base.currentPage,
        filters: base.filters,
        sort: base.sort,
        coordinates: base.coordinates,
      }}
    >
      {children}
    </SearchResultsProvider>
  );
}
