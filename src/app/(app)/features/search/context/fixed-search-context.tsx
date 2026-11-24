'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useMemo } from 'react';

/**
 * A page whose search is fixed by its path, not its query string: an SEO
 * landing page (docs/landing-pages.md). The query string then only refines
 * it, and the results' controls (filters, age, distance) keep the visitor on
 * the page.
 */
export type FixedSearch = {
  /** The page's search as `/search` URL parameters. */
  params: [string, string][];
  /** Where a `…/search?…` URL a control produced takes the visitor. */
  toHref: (searchUrl: string) => string;
};

const FixedSearchContext = createContext<FixedSearch | null>(null);

export const FixedSearchProvider = FixedSearchContext.Provider;

export function useFixedSearch(): FixedSearch | null {
  return useContext(FixedSearchContext);
}

/** The fixed search's parameters plus the query string's other keys. */
export function withFixedSearch(
  fixed: FixedSearch | null,
  query: string,
): string {
  const current = new URLSearchParams(query.replace(/^\?/, ''));
  if (!fixed) return current.toString();
  const fixedKeys = new Set(fixed.params.map(([key]) => key));
  return new URLSearchParams([
    ...fixed.params,
    ...[...current].filter(([key]) => !fixedKeys.has(key)),
  ]).toString();
}

/**
 * The search the page shows, as URL parameters: the query string, with a
 * fixed search's parameters added on a landing page.
 */
export function useEffectiveSearchParams(): URLSearchParams {
  const searchParams = useSearchParams();
  const fixed = useFixedSearch();
  const query = searchParams?.toString() ?? '';
  return useMemo(
    () => new URLSearchParams(withFixedSearch(fixed, query)),
    [fixed, query],
  );
}
