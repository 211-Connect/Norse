'use client';
import { createContext, useContext, useState } from 'react';

type SearchContextType = {};

const searchContext = createContext<SearchContextType | undefined>(undefined);

type SearchProviderProps = {
  children: React.ReactNode;
};

export function SearchProvider({ children }: SearchProviderProps) {
  return <searchContext.Provider value={{}}>{children}</searchContext.Provider>;
}

export function useSearch() {
  const context = useContext(searchContext);
  if (!context) {
    throw new Error('useSearch must be used within an SearchProvider');
  }
  return context;
}
