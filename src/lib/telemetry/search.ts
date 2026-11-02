import { type Attributes, trace } from '@opentelemetry/api';

import type { SearchEngine } from '@/types/appConfig';

import { lazy } from './meter';

/**
 * Search telemetry (plan N5).
 *
 * Privacy rule 8: the only values allowed out of a search are the API version,
 * the search engine, the page number, the page size, result counts and whether
 * the cache served the request. The search text, location, coordinates,
 * taxonomy codes and filters must never reach an attribute, because this is a
 * crisis-services directory.
 */

export type SearchApi = 'v1' | 'v2';

/** Page-size buckets: 25 is the default page size. */
export type LimitBucket = 'le25' | 'le50' | 'gt50';

export function limitBucket(limit: number): LimitBucket {
  if (limit <= 25) return 'le25';
  if (limit <= 50) return 'le50';
  return 'gt50';
}

const instruments = lazy((meter) => ({
  requests: meter.createCounter('norse.search.requests', {
    description:
      'Search requests from norse-app, by API version, cache result and page size',
  }),
}));

export interface SearchObservation {
  api: SearchApi;
  engine: SearchEngine;
  page: number;
  /** Resolved page size (the default is applied before this is called). */
  limit: number;
  /** Number of hits returned (`0` for an empty or failed response). */
  results: number;
  totalResults: number;
  /** True when memory or Redis served the value without calling the API. */
  cacheHit: boolean;
}

/**
 * The only search attributes that may leave this process. Built field by field
 * from an explicit allowlist; nothing from the request is spread in, so a new
 * field on the search state can never leak by accident.
 */
export function searchSpanAttributes(
  observation: SearchObservation,
): Attributes {
  return {
    'search.api': observation.api,
    'search.engine': observation.engine,
    'search.page': observation.page,
    'search.limit': observation.limit,
    'search.results': observation.results,
    'search.total_results': observation.totalResults,
    'search.cache_hit': observation.cacheHit,
  };
}

/** Records the `norse.search.requests` counter. Never throws. */
export function recordSearchRequest(
  observation: Pick<SearchObservation, 'api' | 'cacheHit' | 'limit'>,
): void {
  try {
    instruments().requests.add(1, {
      api: observation.api,
      cache_hit: observation.cacheHit ? 'true' : 'false',
      limit: limitBucket(observation.limit),
    });
  } catch {
    // Telemetry must never break a search (plan rule 7).
  }
}

/** Adds the search attributes to the active span, when there is one. */
export function recordSearchSpan(observation: SearchObservation): void {
  try {
    trace.getActiveSpan()?.setAttributes(searchSpanAttributes(observation));
  } catch {
    // Telemetry must never break a search (plan rule 7).
  }
}

/** One counter sample and one set of span attributes per search response. */
export function recordSearch(observation: SearchObservation): void {
  recordSearchRequest(observation);
  recordSearchSpan(observation);
}
