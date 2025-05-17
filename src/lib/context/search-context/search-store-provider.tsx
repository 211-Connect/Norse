'use client';
import { createContext, useContext, useRef } from 'react';
import { createStore, StoreApi, useStore } from 'zustand';
import { createSearchStore, SearchStore } from './search-store';

type SearchContextType = {
  query: string;
  queryLabel: string;
  queryType: string;
  searchTerm: string;
};

export type SearchStoreApi = ReturnType<typeof createSearchStore>;

export const SearchStoreContext = createContext<SearchStoreApi | undefined>(
  undefined,
);

type SearchProviderProps = {
  children: React.ReactNode;
};

export function SearchStoreProvider({ children }: SearchProviderProps) {
  const searchStoreRef = useRef<SearchStoreApi | null>(null);

  if (!searchStoreRef.current) {
    searchStoreRef.current = createSearchStore();
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
