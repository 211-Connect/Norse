'use client';

import dayjs from 'dayjs';

import { fetchWrapper } from '../../../app/(app)/shared/lib/fetchWrapper';
import type {
  AnalyticsInfoResponse,
  AnalyticsMetricsResponse,
  AreaSearchesResponse,
  EventCatalogEntryResponse,
  EventValuesResponse,
  HeatmapPointResponse,
  LanguageSwitchesResponse,
  PageviewsResponse,
  PaginatedSessionsResponse,
  ResourceByEntryResponse,
  ResourceMetricsResponse,
  SearchesResponse,
  StatsResponse,
  ZeroResultQueriesResponse,
} from '../../../lib/api/generated/data-contracts';
import type { DateRange } from './types';
import { buildAnalyticsQuery } from './utils';

const TTL_MS = 30 * 1000;

type CacheEntry<T> = { promise: Promise<T>; timestamp: number };

type TimeWindow = ReturnType<typeof timeWindow>;

function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < TTL_MS;
}

function normalizeWebsiteIds(websiteIds: string[] | undefined): string {
  if (!websiteIds || websiteIds.length === 0) return '';
  return [...websiteIds].sort().join(',');
}

function cacheKey(
  range: DateRange,
  tenantId: string | undefined,
  websiteIds: string[] | undefined,
): string {
  const rangeKey =
    typeof range === 'number' ? range : `${range.start}:${range.end}`;
  return `${rangeKey}:${tenantId ?? ''}:${normalizeWebsiteIds(websiteIds)}`;
}

function getCache<T>(
  map: Map<string, CacheEntry<T>>,
  key: string,
): Promise<T> | undefined {
  const entry = map.get(key);
  return entry && isFresh(entry) ? entry.promise : undefined;
}

function setCache<T>(
  map: Map<string, CacheEntry<T>>,
  key: string,
  promise: Promise<T>,
): void {
  map.set(key, { promise, timestamp: Date.now() });
}

function timeWindow(range: DateRange) {
  let endAt: number;
  let startAt: number;
  let rangeDays: number;

  if (typeof range === 'number') {
    // Preset range: use current time as end
    endAt = dayjs().valueOf();
    startAt = dayjs().subtract(range, 'day').valueOf();
    rangeDays = range;
  } else {
    // Custom range: use specified dates
    endAt = Math.min(
      dayjs(range.end).endOf('day').valueOf(),
      dayjs().valueOf(),
    );
    startAt = dayjs(range.start).startOf('day').valueOf();
    rangeDays = dayjs(range.end).diff(dayjs(range.start), 'day');
  }

  // Calculate previous period for comparison
  const prevEndAt = startAt;
  const prevStartAt = dayjs(startAt).subtract(rangeDays, 'day').valueOf();

  return { endAt, startAt, prevEndAt, prevStartAt };
}

function makeCachedFetch<T>(
  cache: Map<string, CacheEntry<T>>,
  load: (
    window: TimeWindow,
    tenantId: string | undefined,
    websiteIds: string[] | undefined,
  ) => Promise<T>,
) {
  return function (
    range: DateRange,
    tenantId: string | undefined,
    websiteIds?: string[],
    force?: boolean,
  ): Promise<T> {
    const key = cacheKey(range, tenantId, websiteIds);
    if (force) {
      cache.delete(key);
    } else {
      const cached = getCache(cache, key);
      if (cached) return cached;
    }
    const promise = load(timeWindow(range), tenantId, websiteIds);
    setCache(cache, key, promise);
    return promise;
  };
}

function makeCachedFetchWithArgs<T, A extends Record<string, string>>(
  cache: Map<string, CacheEntry<T>>,
  argsToKey: (args: A) => string,
  load: (
    window: TimeWindow,
    tenantId: string | undefined,
    websiteIds: string[] | undefined,
    args: A,
  ) => Promise<T>,
) {
  return function (
    range: DateRange,
    tenantId: string | undefined,
    websiteIds: string[] | undefined,
    args: A,
    force?: boolean,
  ): Promise<T> {
    const key = `${cacheKey(range, tenantId, websiteIds)}:${argsToKey(args)}`;
    if (force) {
      cache.delete(key);
    } else {
      const cached = getCache(cache, key);
      if (cached) return cached;
    }
    const promise = load(timeWindow(range), tenantId, websiteIds, args);
    setCache(cache, key, promise);
    return promise;
  };
}

export const fetchAnalyticsInfo = (() => {
  const cache = new Map<string, CacheEntry<AnalyticsInfoResponse>>();

  return function (
    tenantId: string | undefined,
    force?: boolean,
  ): Promise<AnalyticsInfoResponse> {
    if (!tenantId) {
      return Promise.reject(new Error('tenantId is required'));
    }
    const key = tenantId;
    if (!force) {
      const cached = getCache(cache, key);
      if (cached) return cached;
    }
    const promise = fetchWrapper<AnalyticsInfoResponse>(
      `/api/analytics/info?tenantId=${encodeURIComponent(tenantId)}`,
    ).then((data) => {
      if (!data) throw new Error('No info data returned');
      return data;
    });
    setCache(cache, key, promise);
    return promise;
  };
})();

export const fetchAnalyticsStats = makeCachedFetch(
  new Map<string, CacheEntry<StatsResponse>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<StatsResponse>(
      buildAnalyticsQuery(
        '/analytics/stats',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No stats data returned');
    return data;
  },
);

export type AnalyticsMetricsWithTrend = {
  current: AnalyticsMetricsResponse;
  previous: AnalyticsMetricsResponse;
};

export const fetchAnalyticsMetrics = makeCachedFetch(
  new Map<string, CacheEntry<AnalyticsMetricsWithTrend>>(),
  async ({ startAt, endAt, prevStartAt, prevEndAt }, tenantId, websiteIds) => {
    const [current, previous] = await Promise.all([
      fetchWrapper<AnalyticsMetricsResponse>(
        buildAnalyticsQuery(
          '/analytics/metrics',
          startAt,
          endAt,
          tenantId,
          { timezone: 'UTC' },
          websiteIds,
        ),
      ),
      fetchWrapper<AnalyticsMetricsResponse>(
        buildAnalyticsQuery(
          '/analytics/metrics',
          prevStartAt,
          prevEndAt,
          tenantId,
          { timezone: 'UTC' },
          websiteIds,
        ),
      ),
    ]);
    if (!current) throw new Error('No metrics data returned');
    if (!previous) throw new Error('No previous metrics data returned');
    return { current, previous };
  },
);

export const fetchAnalyticsPageviews = makeCachedFetch(
  new Map<string, CacheEntry<PageviewsResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<PageviewsResponse[]>(
      buildAnalyticsQuery(
        '/analytics/pageviews',
        startAt,
        endAt,
        tenantId,
        { timezone: 'UTC' },
        websiteIds,
      ),
    );
    if (!data) throw new Error('No pageviews data returned');
    return data;
  },
);

export const fetchAnalyticsResourceMetrics = makeCachedFetch(
  new Map<string, CacheEntry<ResourceMetricsResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<ResourceMetricsResponse[]>(
      buildAnalyticsQuery(
        '/analytics/resource-metrics',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No resource metrics data returned');
    return data;
  },
);

export const fetchAnalyticsSearches = makeCachedFetch(
  new Map<string, CacheEntry<SearchesResponse>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<SearchesResponse>(
      buildAnalyticsQuery(
        '/analytics/searches',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No searches data returned');
    return data;
  },
);

export const fetchAnalyticsZeroResultQueries = makeCachedFetch(
  new Map<string, CacheEntry<ZeroResultQueriesResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<ZeroResultQueriesResponse[]>(
      buildAnalyticsQuery(
        '/analytics/zero-result-queries',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No zero-result queries data returned');
    return data;
  },
);

export const fetchAnalyticsLanguageSwitches = makeCachedFetch(
  new Map<string, CacheEntry<LanguageSwitchesResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<LanguageSwitchesResponse[]>(
      buildAnalyticsQuery(
        '/analytics/language-switches',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No language switches data returned');
    return data;
  },
);

export const fetchAnalyticsResourceByEntry = makeCachedFetch(
  new Map<string, CacheEntry<ResourceByEntryResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<ResourceByEntryResponse[]>(
      buildAnalyticsQuery(
        '/analytics/resource-by-entry',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No resource by entry data returned');
    return data;
  },
);

export const fetchAnalyticsSessions = makeCachedFetch(
  new Map<string, CacheEntry<PaginatedSessionsResponse>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<PaginatedSessionsResponse>(
      buildAnalyticsQuery(
        '/analytics/sessions',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No sessions data returned');
    return data;
  },
);

export const fetchAnalyticsHeatmap = makeCachedFetch(
  new Map<string, CacheEntry<HeatmapPointResponse[]>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<HeatmapPointResponse[]>(
      buildAnalyticsQuery(
        '/analytics/heatmap',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No heatmap data returned');
    return data;
  },
);

export const fetchAnalyticsAreaSearches = makeCachedFetch(
  new Map<string, CacheEntry<AreaSearchesResponse>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<AreaSearchesResponse>(
      buildAnalyticsQuery(
        '/analytics/area-searches',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    if (!data) throw new Error('No area searches data returned');
    return data;
  },
);

export const fetchAnalyticsEventCatalog = (() => {
  const cache = new Map<string, CacheEntry<EventCatalogEntryResponse[]>>();

  return function (
    tenantId: string | undefined,
    force?: boolean,
  ): Promise<EventCatalogEntryResponse[]> {
    if (!tenantId) {
      return Promise.reject(new Error('tenantId is required'));
    }
    const key = tenantId;
    if (!force) {
      const cached = getCache(cache, key);
      if (cached) return cached;
    }
    const promise = fetchWrapper<EventCatalogEntryResponse[]>(
      `/api/analytics/event-catalog?tenantId=${encodeURIComponent(tenantId)}`,
    ).then((data) => {
      if (!data) throw new Error('No event catalog data returned');
      return data;
    });
    setCache(cache, key, promise);
    return promise;
  };
})();

export const fetchAnalyticsEventValues = makeCachedFetchWithArgs<
  EventValuesResponse[],
  { event: string; property: string }
>(
  new Map<string, CacheEntry<EventValuesResponse[]>>(),
  ({ event, property }) => `${event}:${property}`,
  async ({ startAt, endAt }, tenantId, websiteIds, { event, property }) => {
    const data = await fetchWrapper<EventValuesResponse[]>(
      buildAnalyticsQuery(
        '/analytics/event-values',
        startAt,
        endAt,
        tenantId,
        { event, property },
        websiteIds,
      ),
    );
    if (!data) throw new Error('No event values data returned');
    return data;
  },
);
