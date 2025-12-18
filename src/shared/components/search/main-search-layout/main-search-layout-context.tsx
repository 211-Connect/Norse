'use client';

import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useSearchResources } from '../../../hooks/use-search-resources';

export interface MainSearchLayoutContextValue
  extends ReturnType<typeof useSearchResources> {
  shouldSearch: boolean;
  setShouldSearch: Dispatch<SetStateAction<boolean>>;
}

const MainSearchLayoutContext =
  createContext<MainSearchLayoutContextValue | null>(null);

export function MainSearchLayoutContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const [shouldSearch, setShouldSearch] = useState(false);

  const searchResources = useSearchResources();

  const value = useMemo(
    () => ({
      ...searchResources,
      shouldSearch,
      setShouldSearch,
    }),
    [searchResources, shouldSearch, setShouldSearch],
  );

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
