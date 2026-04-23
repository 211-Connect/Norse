'use client';

import { useState, useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import type {
  DateRange,
  MetricEntry,
  MetricsExpandedEntry,
  UmamiPageviews,
  UmamiSessionResponse,
  UmamiStats,
} from './types';
import {
  buildProxyQuery,
  enrichWithResourceTitles,
  parseMetrics,
  sumEventTotals,
} from './utils';
import { UmamiEvent } from '../../../../../app/(app)/shared/lib/umami';
import { fetchWrapper } from '../../../../../app/(app)/shared/lib/fetchWrapper';
import { geocodeSessions } from './geocodeSessions';
import { HeatmapPoint } from './AnalyticsMap';

export interface Metric {
  current: number;
  previous: number;
}

export interface AnalyticsMetrics {
  searches: Metric;
  resourceViews: Metric;
  zeroResults: Metric;
  directions: Metric;
  phoneCalls: Metric;
  websiteClicks: Metric;
  widgetSearches: Metric;
}

export interface AnalyticsData {
  stats: UmamiStats | null;
  pageviews: UmamiPageviews | null;
  resourceRows: MetricEntry[];
  searchByLabel: MetricEntry[];
  metrics: AnalyticsMetrics;
  heatmapPoints: HeatmapPoint[];
}

const EMPTY_METRICS: AnalyticsMetrics = {
  searches: { current: 0, previous: 0 },
  resourceViews: { current: 0, previous: 0 },
  zeroResults: { current: 0, previous: 0 },
  directions: { current: 0, previous: 0 },
  phoneCalls: { current: 0, previous: 0 },
  websiteClicks: { current: 0, previous: 0 },
  widgetSearches: { current: 0, previous: 0 },
};

const EMPTY_DATA: AnalyticsData = {
  stats: null,
  pageviews: null,
  resourceRows: [],
  searchByLabel: [],
  metrics: EMPTY_METRICS,
  heatmapPoints: [],
};

export function useAnalytics(range: DateRange, tenantId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const endAt = dayjs().valueOf();
    const startAt = dayjs().subtract(range, 'day').valueOf();
    const prevEndAt = startAt;
    const prevStartAt = dayjs(startAt).subtract(range, 'day').valueOf();

    try {
      const [
        statsData,
        pageViewsData,
        pathMetricsData,
        queryMetricsData,
        eventsData,
        prevPathMetricsData,
        prevQueryMetricsData,
        prevEventsData,
        sessionsData,
      ] = await Promise.all([
        fetchWrapper<UmamiStats>( // total users, total page views
          buildProxyQuery('stats', startAt, endAt, tenantId),
        ),
        fetchWrapper<UmamiPageviews>( // page views in time for chart
          buildProxyQuery('pageviews', startAt, endAt, tenantId, {
            unit: 'day',
            timezone: 'UTC',
          }),
        ),
        fetchWrapper<MetricsExpandedEntry[]>( // metrics for total search count and resources table
          buildProxyQuery('metrics/expanded', startAt, endAt, tenantId, {
            type: 'path',
          }),
        ),
        fetchWrapper<MetricsExpandedEntry[]>( // metrics for query labels tables
          buildProxyQuery('metrics/expanded', startAt, endAt, tenantId, {
            type: 'query',
          }),
        ),
        fetchWrapper<MetricEntry[]>( // metrics for events totals (zero results, directions, phone calls, website clicks, widget searches)
          buildProxyQuery('events/series', startAt, endAt, tenantId, {
            timezone: 'UTC',
          }),
        ),
        fetchWrapper<MetricsExpandedEntry[]>( // metrics for total search count and resources table for previous period
          buildProxyQuery(
            'metrics/expanded',
            prevStartAt,
            prevEndAt,
            tenantId,
            {
              type: 'path',
            },
          ),
        ),
        fetchWrapper<MetricsExpandedEntry[]>( // metrics for query labels tables for previous period
          buildProxyQuery(
            'metrics/expanded',
            prevStartAt,
            prevEndAt,
            tenantId,
            {
              type: 'query',
            },
          ),
        ),
        fetchWrapper<MetricEntry[]>( // metrics for events totals (zero results, directions, phone calls, website clicks, widget searches) for previous period
          buildProxyQuery('events/series', prevStartAt, prevEndAt, tenantId, {
            timezone: 'UTC',
          }),
        ),
        fetchWrapper<UmamiSessionResponse>( // sessions for heatmap
          buildProxyQuery('sessions', startAt, endAt, tenantId),
        ),
      ]);

      const eventTotals = sumEventTotals(eventsData ?? []);
      const prevEventTotals = sumEventTotals(prevEventsData ?? []);

      const { searchCount, resourceMetrics, searchByLabel } = parseMetrics(
        pathMetricsData ?? [],
        queryMetricsData ?? [],
      );
      const {
        searchCount: prevSearchCount,
        resourceMetrics: prevResourceMetrics,
      } = parseMetrics(prevPathMetricsData ?? [], prevQueryMetricsData ?? []);

      const enrichedResourceRows = await enrichWithResourceTitles(
        resourceMetrics,
        String(tenantId),
      );

      const points = await geocodeSessions(sessionsData?.data ?? [], tenantId);

      setData({
        stats: statsData,
        pageviews: pageViewsData,
        resourceRows: enrichedResourceRows,
        searchByLabel,
        metrics: {
          searches: { current: searchCount, previous: prevSearchCount },
          resourceViews: {
            current: resourceMetrics.reduce((sum, m) => sum + m.y, 0),
            previous: prevResourceMetrics.reduce((sum, m) => sum + m.y, 0),
          },
          zeroResults: {
            current: eventTotals[UmamiEvent.SearchZeroResults] ?? 0,
            previous: prevEventTotals[UmamiEvent.SearchZeroResults] ?? 0,
          },
          directions: {
            current: eventTotals[UmamiEvent.DirectionClick] ?? 0,
            previous: prevEventTotals[UmamiEvent.DirectionClick] ?? 0,
          },
          phoneCalls: {
            current: eventTotals[UmamiEvent.PhoneClick] ?? 0,
            previous: prevEventTotals[UmamiEvent.PhoneClick] ?? 0,
          },
          websiteClicks: {
            current: eventTotals[UmamiEvent.WebsiteClick] ?? 0,
            previous: prevEventTotals[UmamiEvent.WebsiteClick] ?? 0,
          },
          widgetSearches: {
            current: eventTotals[UmamiEvent.WidgetSearch] ?? 0,
            previous: prevEventTotals[UmamiEvent.WidgetSearch] ?? 0,
          },
        },
        heatmapPoints: points,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [range, tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, error, data };
}
