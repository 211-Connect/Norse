'use client';

import { createContext, useContext, type PropsWithChildren } from 'react';

import {
  SearchResultsProvider,
  useSearchResults,
} from '../context/search-results-context';
import { useV2Search } from '../v2/use-v2-search';
import { v2Results } from '../v2/v2-results';

const IsV2Context = createContext(false);

/**
 * True while the page shows `/v2/search` results. v1 tenants and a v2 engine that is off get false,
 * so a v2 difference in a shared v1 component sits behind this and v1 stays as it was.
 */
export const useIsV2 = () => useContext(IsV2Context);

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
    <IsV2Context.Provider value={Boolean(v2)}>
      <SearchResultsProvider
        value={{
          ...base,
          results: v2?.results ?? base.results,
          totalResults: v2?.totalResults ?? base.totalResults,
        }}
      >
        {children}
      </SearchResultsProvider>
    </IsV2Context.Provider>
  );
}
