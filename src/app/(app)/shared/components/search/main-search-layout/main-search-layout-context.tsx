'use client';

import { PropsWithChildren, createContext, useContext } from 'react';

import { useSearchResources } from '../../../hooks/use-search-resources';

export interface MainSearchLayoutContextValue extends ReturnType<
  typeof useSearchResources
> {}

export const MainSearchLayoutContext =
  createContext<MainSearchLayoutContextValue | null>(null);

export function MainSearchLayoutContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const value = useSearchResources();

  return (
    <MainSearchLayoutContext.Provider value={value}>
      {children}
    </MainSearchLayoutContext.Provider>
  );
}

export const useMainSearchLayoutContext = () => {
  const context = useContext(MainSearchLayoutContext);
  if (!context) {
    throw new Error('No MainSearchLayoutContext found');
  }
  return context;
};
