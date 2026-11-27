'use client';

import { type PropsWithChildren, useMemo } from 'react';

import { FixedSearchProvider } from '@/app/(app)/features/search/context/fixed-search-context';

import { toLandingHref } from '../lib/search';

/**
 * Fixes the results' search to the landing page's own: filters, age and
 * distance stay on the page as a query string, and a search that is no longer
 * the page's goes to `/search`.
 */
export function LandingSearchProvider({
  params,
  path,
  children,
}: PropsWithChildren<{
  /** The page's search as `/search` parameters (`landingBaseParams`). */
  params: [string, string][];
  /** The page's path with its locale prefix. */
  path: string;
}>) {
  const value = useMemo(
    () => ({
      params,
      toHref: (searchUrl: string) => toLandingHref(searchUrl, path, params),
    }),
    [params, path],
  );
  return <FixedSearchProvider value={value}>{children}</FixedSearchProvider>;
}
