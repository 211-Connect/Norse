'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { getSearchParamsObject } from '../lib/search-params';

export const useClientSearchParams = () => {
  const searchParams = useSearchParams();

  const stringifySearchParams = useCallback(
    (searchParamsAttr: URLSearchParams) => {
      const params = searchParamsAttr.toString().replace(/\+/g, '%20');
      return params ? `?${params}` : '';
    },
    [],
  );

  const stringifiedSearchParams = useMemo(
    () => (searchParams ? stringifySearchParams(searchParams) : ''),
    [searchParams, stringifySearchParams],
  );

  const searchParamsObject = useMemo(
    () => (searchParams ? getSearchParamsObject(searchParams) : {}),
    [searchParams],
  );

  return {
    searchParamsObject,
    stringifiedSearchParams,
    stringifySearchParams,
  };
};
