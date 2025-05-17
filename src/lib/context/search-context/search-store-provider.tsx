'use client';
import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createSearchStore, SearchStore } from './search-store';

export type SearchStoreApi = ReturnType<typeof createSearchStore>;

export const SearchStoreContext = createContext<SearchStoreApi | undefined>(
  undefined,
);

type SearchProviderProps = {
  children: React.ReactNode;
  searchTerm: SearchStore['searchTerm'];
};

export function SearchStoreProvider({
  children,
  searchTerm,
}: SearchProviderProps) {
  const searchStoreRef = useRef<SearchStoreApi | null>(null);

  if (!searchStoreRef.current) {
    searchStoreRef.current = createSearchStore({
      searchTerm,
    });
  }

  return (
    <SearchStoreContext.Provider value={searchStoreRef.current}>
      {children}
    </SearchStoreContext.Provider>
  );
}

export const useSearchStore = <T,>(selector: (store: SearchStore) => T): T => {
  const searchStoreContext = useContext(SearchStoreContext);

  if (!searchStoreContext) {
    throw new Error(`useSearchStore must be used within SearchStoreContext`);
  }

  return useStore(searchStoreContext, selector);
};
