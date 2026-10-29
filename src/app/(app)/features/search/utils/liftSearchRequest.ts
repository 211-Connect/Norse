import { cache } from 'react';

import {
  liftQueryString,
  type LiftedSearch,
  type RawSearchParams,
} from '@/app/(app)/features/search/intent';

/**
 * The query string Next.js decoded `searchParams` from, rebuilt. Metadata and the page each receive their
 * own `searchParams` object, so the per-request cache is keyed by this string, not by the object.
 */
export function searchRequestKey(raw: RawSearchParams): string {
  const entries = Object.entries(raw).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? '']).map(
      (v) => [key, v] as [string, string],
    ),
  );
  return new URLSearchParams(entries).toString();
}

const liftOnce = cache((key: string): LiftedSearch => liftQueryString(key));

/** The search request's intent and envelope, lifted once per request and shared by metadata and the page. */
export function liftSearchRequest(raw: RawSearchParams): LiftedSearch {
  return liftOnce(searchRequestKey(raw));
}
