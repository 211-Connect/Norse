import { type Attributes, trace } from '@opentelemetry/api';

import {
  type CacheConfig,
  type CacheKey,
  withCache,
} from '@/utilities/withCache';

/**
 * The size of one search job, as attributes on the active span (ISS-1739).
 *
 * The wait a request sees on the Node thread depends on how uneven the jobs
 * are: a `limit=100` search is approximately 1 MB of JSON to parse and 100
 * results to render, a cached one is almost nothing. These attributes make
 * the job size queryable in Tempo, so latency can be grouped by it:
 * `{ span.search.limit >= 100 }`, `{ span.search.cache_hit = false }`.
 *
 * The query text is never an attribute; it can carry a crisis search.
 */
export interface SearchJob {
  /** `v1` is GET /search; `v2` is the POST geospatial search. */
  api: 'v1' | 'v2';
  engine: string;
  page: number;
  limit: number;
  /** Results returned on this page. */
  results: number;
  /** Total hits reported by the API. */
  totalResults: number;
  /** True when the memory or Redis cache answered and the API was not called. */
  cacheHit: boolean;
}

export function searchJobAttributes(job: SearchJob): Attributes {
  return {
    'search.api': job.api,
    'search.engine': job.engine,
    'search.page': job.page,
    'search.limit': job.limit,
    'search.results': job.results,
    'search.total_results': job.totalResults,
    'search.cache_hit': job.cacheHit,
  };
}

/** Results per page when the request does not say. Same default as the API. */
export const DEFAULT_SEARCH_LIMIT = 25;

export function normalizeLimit(limit: number | undefined): number {
  return !limit || Number.isNaN(limit) ? DEFAULT_SEARCH_LIMIT : limit;
}

interface SearchLike {
  results: unknown[];
  totalResults: number;
}

/**
 * `withCache` for a search, recording the job on the active span once the
 * value is known. The cache is a hit when `fetcher` never ran.
 */
export async function withSearchJob<T extends SearchLike>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  config: CacheConfig,
  shouldCache: (value: T) => boolean,
  job: Pick<SearchJob, 'api' | 'engine' | 'page' | 'limit'>,
): Promise<T | null> {
  let fetched = false;
  const value = await withCache(
    key,
    () => {
      fetched = true;
      return fetcher();
    },
    config,
    shouldCache,
  );
  trace.getActiveSpan()?.setAttributes(
    searchJobAttributes({
      ...job,
      results: value?.results.length ?? 0,
      totalResults: value?.totalResults ?? 0,
      cacheHit: !fetched,
    }),
  );
  return value;
}
