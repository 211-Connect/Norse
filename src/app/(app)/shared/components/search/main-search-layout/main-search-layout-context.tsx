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

export interface MainSearchLayoutContextValue extends ReturnType<
  typeof useSearchResources
> {
  shouldSearch: boolean;
  setShouldSearch: Dispatch<SetStateAction<boolean>>;
  searchSource: 'manual' | 'suggestion';
  setSearchSource: Dispatch<SetStateAction<'manual' | 'suggestion'>>;
}

export const MainSearchLayoutContext =
  createContext<MainSearchLayoutContextValue | null>(null);

export function MainSearchLayoutContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const [shouldSearch, setShouldSearch] = useState(false);
  const [searchSource, setSearchSource] = useState<'manual' | 'suggestion'>('manual');

  const searchResources = useSearchResources();

  const value = useMemo(
    () => ({
      ...searchResources,
      shouldSearch,
      setShouldSearch,
      searchSource,
      setSearchSource,
    }),
    [searchResources, shouldSearch, setShouldSearch, searchSource, setSearchSource],
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
