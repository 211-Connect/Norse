'use client';

import { useSearchParams } from 'next/navigation';
import qs from 'qs';
import { useCallback, useMemo } from 'react';

import { currentSearchString } from '../utils/currentSearchString';

export const useClientSearchParams = () => {
  const searchParams = useSearchParams();

  // Drops crawl-trap keys too (ISS-2307), so no writer using it can re-emit them.
  const stringifySearchParams = useCallback(
    (searchParamsAttr: URLSearchParams) =>
      currentSearchString(searchParamsAttr),
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
