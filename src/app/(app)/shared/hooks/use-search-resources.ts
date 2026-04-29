'use client';

import { useAtomValue, useSetAtom } from 'jotai';

import { searchAtom } from '../store/search';

export const useSearchResources = () => {
  const search = useAtomValue(searchAtom);
  const setSearch = useSetAtom(searchAtom);

  return {
    search,
    setSearch,
  };
};
