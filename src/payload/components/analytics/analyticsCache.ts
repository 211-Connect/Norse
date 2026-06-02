'use client';

import dayjs from 'dayjs';

import { fetchWrapper } from '../../../app/(app)/shared/lib/fetchWrapper';
import { UmamiEvent } from '../../../app/(app)/shared/lib/umami';
import { geocodeSessions } from './geocodeSessions';
import type {
  AnalyticsMetrics,
  DateRange,
  EventsData,
  LanguageSwitchDestinationsData,
  Metric,
  MetricEntry,
  MetricsData,
  MetricsExpandedEntry,
  PathsData,
  ResourceByEntryData,
  SessionHeatmapData,
  SessionsData,
  UmamiEventDataValue,
  UmamiPageviews,
  UmamiSessionResponse,
  UmamiStats,
  ZeroResultQueriesData,
} from './types';
import {
  buildProxyQuery,
  mergeSearchByLabelBuckets,
  parseMetrics,
  sumEventTotals,
} from './utils';

const TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = { promise: Promise<T>; timestamp: number };

type TimeWindow = ReturnType<typeof timeWindow>;

function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < TTL_MS;
}

function toMetricEntries(
  rows: UmamiEventDataValue[] | undefined,
): MetricEntry[] {
  return (rows ?? [])
    .map((row) => ({
      x: String(row.value ?? '').trim(),
      y: Number(row.total) || 0,
    }))
    .filter((row) => row.x.length > 0 && row.y > 0)
    .sort((a, b) => b.y - a.y);
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
    endAt = dayjs(range.end).endOf('day').valueOf();
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
  ): Promise<T> {
    const key = cacheKey(range, tenantId, websiteIds);
    const cached = getCache(cache, key);
    if (cached) return cached;
    const promise = load(timeWindow(range), tenantId, websiteIds);
    setCache(cache, key, promise);
    return promise;
  };
}

export const fetchStats = makeCachedFetch(
  new Map<string, CacheEntry<UmamiStats>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<UmamiStats>(
      buildProxyQuery('stats', startAt, endAt, tenantId, undefined, websiteIds),
    );
    if (!data) throw new Error('No stats data returned');
    return data;
  },
);

export const fetchPageviews = makeCachedFetch(
  new Map<string, CacheEntry<UmamiPageviews>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<UmamiPageviews>(
      buildProxyQuery(
        'pageviews',
        startAt,
        endAt,
        tenantId,
        {
          unit: 'day',
          timezone: 'UTC',
        },
        websiteIds,
      ),
    );
    if (!data) throw new Error('No pageviews data returned');
    return data;
  },
);

export const fetchMetrics = makeCachedFetch(
  new Map<string, CacheEntry<MetricsData>>(),
  async ({ startAt, endAt, prevStartAt, prevEndAt }, tenantId, websiteIds) => {
    const [
      pathMetrics,
      queryMetrics,
      events,
      prevPathMetrics,
      prevQueryMetrics,
      prevEvents,
    ] = await Promise.all([
      fetchWrapper<MetricsExpandedEntry[]>(
        buildProxyQuery(
          'metrics/expanded',
          startAt,
          endAt,
          tenantId,
          {
            type: 'path',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricsExpandedEntry[]>(
        buildProxyQuery(
          'metrics/expanded',
          startAt,
          endAt,
          tenantId,
          {
            type: 'query',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricEntry[]>(
        buildProxyQuery(
          'events/series',
          startAt,
          endAt,
          tenantId,
          {
            timezone: 'UTC',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricsExpandedEntry[]>(
        buildProxyQuery(
          'metrics/expanded',
          prevStartAt,
          prevEndAt,
          tenantId,
          {
            type: 'path',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricsExpandedEntry[]>(
        buildProxyQuery(
          'metrics/expanded',
          prevStartAt,
          prevEndAt,
          tenantId,
          {
            type: 'query',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricEntry[]>(
        buildProxyQuery(
          'events/series',
          prevStartAt,
          prevEndAt,
          tenantId,
          {
            timezone: 'UTC',
          },
          websiteIds,
        ),
      ),
    ]);

    const eventTotals = sumEventTotals(events ?? []);
    const prevEventTotals = sumEventTotals(prevEvents ?? []);

    const { searchCount, resourceMetrics, searchByLabelByType } = parseMetrics(
      pathMetrics ?? [],
      queryMetrics ?? [],
    );
    const searchByLabel = mergeSearchByLabelBuckets(searchByLabelByType);
    const {
      searchCount: prevSearchCount,
      resourceMetrics: prevResourceMetrics,
    } = parseMetrics(prevPathMetrics ?? [], prevQueryMetrics ?? []);

    const metric = (current: number, previous: number): Metric => ({
      current,
      previous,
    });

    const metrics: AnalyticsMetrics = {
      searches: metric(searchCount, prevSearchCount),
      resourceViews: metric(
        resourceMetrics.reduce((s, m) => s + m.y, 0),
        prevResourceMetrics.reduce((s, m) => s + m.y, 0),
      ),
      zeroResults: metric(
        eventTotals[UmamiEvent.SearchZeroResults] ?? 0,
        prevEventTotals[UmamiEvent.SearchZeroResults] ?? 0,
      ),
      directions: metric(
        eventTotals[UmamiEvent.DirectionClick] ?? 0,
        prevEventTotals[UmamiEvent.DirectionClick] ?? 0,
      ),
      phoneCalls: metric(
        eventTotals[UmamiEvent.PhoneClick] ?? 0,
        prevEventTotals[UmamiEvent.PhoneClick] ?? 0,
      ),
      websiteClicks: metric(
        eventTotals[UmamiEvent.WebsiteClick] ?? 0,
        prevEventTotals[UmamiEvent.WebsiteClick] ?? 0,
      ),
      widgetSearches: metric(
        eventTotals[UmamiEvent.WidgetSearch] ?? 0,
        prevEventTotals[UmamiEvent.WidgetSearch] ?? 0,
      ),
      calloutClicks: metric(
        eventTotals[UmamiEvent.CalloutClick] ?? 0,
        prevEventTotals[UmamiEvent.CalloutClick] ?? 0,
      ),
    };

    return { metrics, resourceMetrics, searchByLabel };
  },
);

export const fetchPaths = makeCachedFetch(
  new Map<string, CacheEntry<PathsData>>(),
  async ({ startAt, endAt, prevStartAt, prevEndAt }, tenantId, websiteIds) => {
    const [pathMetrics, queryMetrics, prevPathMetrics, prevQueryMetrics] =
      await Promise.all([
        fetchWrapper<MetricsExpandedEntry[]>(
          buildProxyQuery(
            'metrics/expanded',
            startAt,
            endAt,
            tenantId,
            {
              type: 'path',
            },
            websiteIds,
          ),
        ),
        fetchWrapper<MetricsExpandedEntry[]>(
          buildProxyQuery(
            'metrics/expanded',
            startAt,
            endAt,
            tenantId,
            {
              type: 'query',
            },
            websiteIds,
          ),
        ),
        fetchWrapper<MetricsExpandedEntry[]>(
          buildProxyQuery(
            'metrics/expanded',
            prevStartAt,
            prevEndAt,
            tenantId,
            { type: 'path' },
            websiteIds,
          ),
        ),
        fetchWrapper<MetricsExpandedEntry[]>(
          buildProxyQuery(
            'metrics/expanded',
            prevStartAt,
            prevEndAt,
            tenantId,
            { type: 'query' },
            websiteIds,
          ),
        ),
      ]);

    const { searchCount, resourceMetrics, searchByLabelByType } = parseMetrics(
      pathMetrics ?? [],
      queryMetrics ?? [],
    );
    const {
      searchCount: prevSearchCount,
      resourceMetrics: prevResourceMetrics,
    } = parseMetrics(prevPathMetrics ?? [], prevQueryMetrics ?? []);

    return {
      tenantId,
      searchCount,
      prevSearchCount,
      resourceMetrics,
      prevResourceMetrics,
      searchByLabelByType,
    };
  },
);

export const fetchEvents = makeCachedFetch(
  new Map<string, CacheEntry<EventsData>>(),
  async ({ startAt, endAt, prevStartAt, prevEndAt }, tenantId, websiteIds) => {
    const [events, prevEvents] = await Promise.all([
      fetchWrapper<MetricEntry[]>(
        buildProxyQuery(
          'events/series',
          startAt,
          endAt,
          tenantId,
          {
            timezone: 'UTC',
          },
          websiteIds,
        ),
      ),
      fetchWrapper<MetricEntry[]>(
        buildProxyQuery(
          'events/series',
          prevStartAt,
          prevEndAt,
          tenantId,
          {
            timezone: 'UTC',
          },
          websiteIds,
        ),
      ),
    ]);

    const eventTotals = sumEventTotals(events ?? []);
    const prevEventTotals = sumEventTotals(prevEvents ?? []);

    return { eventTotals, prevEventTotals };
  },
);

export const fetchZeroResultQueries = makeCachedFetch(
  new Map<string, CacheEntry<ZeroResultQueriesData>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const zeroResultQueriesRaw = await fetchWrapper<UmamiEventDataValue[]>(
      buildProxyQuery(
        'event-data/values',
        startAt,
        endAt,
        tenantId,
        {
          event: UmamiEvent.SearchZeroResults,
          propertyName: 'query',
        },
        websiteIds,
      ),
    );

    if (!zeroResultQueriesRaw) {
      return { zeroResultQueries: [] };
    }
    const zeroResultQueries = toMetricEntries(zeroResultQueriesRaw);

    return { zeroResultQueries };
  },
);

export const fetchLanguageSwitchDestinations = makeCachedFetch(
  new Map<string, CacheEntry<LanguageSwitchDestinationsData>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const languageSwitchDestinationsRaw = await fetchWrapper<
      UmamiEventDataValue[]
    >(
      buildProxyQuery(
        'event-data/values',
        startAt,
        endAt,
        tenantId,
        {
          event: UmamiEvent.LanguageSwitch,
          propertyName: 'destinationLanguage',
        },
        websiteIds,
      ),
    );

    if (!languageSwitchDestinationsRaw) {
      return { languageSwitchDestinations: [] };
    }

    const languageSwitchDestinations = toMetricEntries(
      languageSwitchDestinationsRaw,
    );

    return { languageSwitchDestinations };
  },
);

export const fetchResourceByEntry = makeCachedFetch(
  new Map<string, CacheEntry<ResourceByEntryData>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const raw = await fetchWrapper<UmamiEventDataValue[]>(
      buildProxyQuery(
        'event-data/values',
        startAt,
        endAt,
        tenantId,
        {
          event: UmamiEvent.ResourceViewed,
          propertyName: 'entry',
        },
        websiteIds,
      ),
    );

    if (!raw) {
      return { resourceByEntry: [] };
    }

    return { resourceByEntry: toMetricEntries(raw) };
  },
);

export const fetchSessions = makeCachedFetch(
  new Map<string, CacheEntry<SessionsData>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<UmamiSessionResponse>(
      buildProxyQuery(
        'sessions',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    return { sessions: data?.data ?? [] };
  },
);

export const fetchSessionHeatmap = makeCachedFetch(
  new Map<string, CacheEntry<SessionHeatmapData>>(),
  async ({ startAt, endAt }, tenantId, websiteIds) => {
    const data = await fetchWrapper<UmamiSessionResponse>(
      buildProxyQuery(
        'sessions',
        startAt,
        endAt,
        tenantId,
        undefined,
        websiteIds,
      ),
    );
    const sessions = data?.data ?? [];
    const heatmapPoints = await geocodeSessions(sessions, tenantId);
    return { heatmapPoints };
  },
);
