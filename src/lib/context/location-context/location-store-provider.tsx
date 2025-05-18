'use client';
import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createLocationStore, LocationStore } from './location-store';

export type LocationStoreApi = ReturnType<typeof createLocationStore>;

export const SearchStoreContext = createContext<LocationStoreApi | undefined>(
  undefined,
);

type SearchProviderProps = {
  children: React.ReactNode;
  searchTerm: LocationStore['searchTerm'] | undefined;
};

export function LocationStoreProvider({
  children,
  searchTerm = '',
}: SearchProviderProps) {
  const locationStoreRef = useRef<LocationStoreApi | null>(null);

  if (!locationStoreRef.current) {
    locationStoreRef.current = createLocationStore({
      searchTerm,
      selectedValue: searchTerm,
    });
  }

  return (
    <SearchStoreContext.Provider value={locationStoreRef.current}>
      {children}
    </SearchStoreContext.Provider>
  );
}

export const useLocationStore = <T,>(
  selector: (store: LocationStore) => T,
): T => {
  const locationStoreContext = useContext(SearchStoreContext);

  if (!locationStoreContext) {
    throw new Error(
      `useLocationStore must be used within LocationStoreProvider`,
    );
  }

  return useStore(locationStoreContext, selector);
};
