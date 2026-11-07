'use client';

import { useSearchParams } from 'next/navigation';
import qs from 'qs';
import { useCallback, useMemo } from 'react';

import { currentSearchString } from '../utils/currentSearchString';

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
    () => currentSearchString(searchParams),
    [searchParams],
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
