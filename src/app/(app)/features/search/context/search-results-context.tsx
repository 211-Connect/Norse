'use client';

import { PropsWithChildren, createContext, useContext } from 'react';

import { type ResultType } from '@/app/(app)/shared/store/results';
import { type SortOption } from '@/app/(app)/shared/utils/getSortOption';
import { type FiltersMap } from '@/types/search';
import { isValidCoordinate } from '@/utils/isValidCoordinate';

/**
 * Read-only result of the `/search` request, rendered by the server page.
 *
 * This deliberately lives in React context rather than Jotai: the Jotai store
 * outlives client navigations and `useHydrateAtoms` only writes once per
 * store, so atoms showed the previous page's values until a post-paint sync
 * effect ran ("0 of 0" next to rendered results). Context carries the current
 * request's values on the very first render, server and client alike.
 */
export type SearchResultsData = {
  results: ResultType[];
  totalResults: number;
  /** 1-based page of `results`. */
  currentPage: number;
  filters: FiltersMap;
  /** Sort the server actually applied (see `getSortOption`). */
  sort: SortOption;
  /** Search origin from the URL `coords`, which is what the server sorts and filters by. */
  coordinates: number[] | null;
};

export type SearchResultsContextValue = SearchResultsData & {
  hasSearchCoordinates: boolean;
};

const SearchResultsContext = createContext<SearchResultsContextValue | null>(
  null,
);

export function SearchResultsProvider({
  value,
  children,
}: PropsWithChildren<{ value: SearchResultsData }>) {
  return (
    <SearchResultsContext.Provider
      value={{
        ...value,
        hasSearchCoordinates: isValidCoordinate(value.coordinates),
      }}
    >
      {children}
    </SearchResultsContext.Provider>
  );
}

export function useSearchResults(): SearchResultsContextValue {
  const value = useContext(SearchResultsContext);

  if (!value) {
    throw new Error(
      'useSearchResults must be used within a SearchResultsProvider',
    );
  }

  return value;
}
