'use client';

import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import qs from 'qs';
import { useCallback, useEffect, useState } from 'react';

import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';

import {
  PENDING_FOCUS_TARGET_STORAGE_KEY,
  SEARCH_RESULTS_HEADING_ID,
} from './constants';

function queueResultsFocus() {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    PENDING_FOCUS_TARGET_STORAGE_KEY,
    SEARCH_RESULTS_HEADING_ID,
  );
}

export function useSearchResultsNavigation() {
  const router = useRouter();
  const { stringifiedSearchParams, searchParamsObject } =
    useClientSearchParams();
  const { start } = useTopLoader();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
  }, [stringifiedSearchParams]);

  const updateSearchParams = useCallback(
    (updater: (params: Record<string, unknown>) => Record<string, unknown>) => {
      queueResultsFocus();

      const nextParams = updater({ ...searchParamsObject });

      if ('page' in nextParams) {
        delete nextParams.page;
      }

      const search = qs.stringify(nextParams);

      setIsPending(true);
      start();
      router.push(`/search${search ? `?${search}` : ''}`);
    },
    [router, searchParamsObject, start],
  );

  return {
    isPending,
    searchParamsObject,
    updateSearchParams,
  };
}
