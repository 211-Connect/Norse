'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import qs from 'qs';

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
    () =>
      stringifiedSearchParams
        ? qs.parse(stringifiedSearchParams, { ignoreQueryPrefix: true })
        : {},
    [stringifiedSearchParams],
  );

  return {
    searchParamsObject,
    stringifiedSearchParams,
    stringifySearchParams,
  };
};
