'use client';

import { useRouter } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';
import { useCallback, useEffect, useState } from 'react';

import {
  rawSearchParams,
  rewriteSearchUrl,
  type SearchIntent,
} from '@/app/(app)/features/search/intent';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { useLocalePrefix } from '@/app/(app)/shared/hooks/use-locale-prefix';

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
  const localePrefix = useLocalePrefix();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
  }, [stringifiedSearchParams]);

  /**
   * Navigates to the current search with a change: the URL is lifted, changed and serialized, so a
   * repeated key reaches the next page as its first value instead of `key[n]` (ISS-2409). A changed
   * search starts on the first page. The URL keeps the page's locale prefix, so the next page is in the
   * same language without depending on the locale cookie.
   */
  const updateSearch = useCallback(
    (change: (intent: SearchIntent) => SearchIntent) => {
      queueResultsFocus();

      const url = rewriteSearchUrl(
        rawSearchParams(stringifiedSearchParams.replace(/^\?/, '')),
        change,
        { newSearch: true, basePath: localePrefix },
      );

      setIsPending(true);
      start();
      router.push(url);
    },
    [router, stringifiedSearchParams, start, localePrefix],
  );

  return {
    isPending,
    searchParamsObject,
    updateSearch,
  };
}
