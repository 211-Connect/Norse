'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import type {
  DateRange,
  UmamiStats,
  UmamiPageviews,
  MetricEntry,
} from './types';
import {
  buildProxyQuery,
  enrichWithResourceTitles,
  parseMetrics,
  sumEventTotals,
} from './utils';
import { StatCards } from './StatCards';
import { MetricsTables } from './MetricsTables';
import { Chart } from './Chart';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Banner, Button, Gutter, StaggeredShimmers } from '@payloadcms/ui';
import { UmamiEvent } from '../../../../../app/(app)/shared/lib/umami';
import { fetchWrapper } from '../../../../../app/(app)/shared/lib/fetchWrapper';

const DATE_RANGES: DateRange[] = [7, 30, 90];

const AnalyticsDashboard = () => {
  const { selectedTenantID } = useTenantSelection();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    stats: UmamiStats | null;
    pageviews: UmamiPageviews | null;
    resourceRows: MetricEntry[];
    searchByLabel: MetricEntry[];
  }>({
    stats: null,
    pageviews: null,
    resourceRows: [],
    searchByLabel: [],
  });
  const [range, setRange] = useState<DateRange>(30);
  const [metrics, setMetrics] = useState({
    searchCount: 0,
    resourceViewCount: 0,
    zeroResultsCount: 0,
    directionsCount: 0,
    phoneCallsCount: 0,
    websiteClicksCount: 0,
  });

  const fetchData = useCallback(
    async (days: DateRange, tenantId: string | undefined) => {
      setLoading(true);
      setError(null);

      const endAt = dayjs().valueOf();
      const startAt = dayjs().subtract(days, 'day').valueOf();

      try {
        const [statsData, metricsData, pvData, queryMetricsData, eventsData] =
          await Promise.all([
            fetchWrapper<UmamiStats>(
              buildProxyQuery('stats', startAt, endAt, tenantId),
            ),
            fetchWrapper<MetricEntry[]>(
              buildProxyQuery('metrics', startAt, endAt, tenantId, {
                type: 'path',
                limit: '500',
              }),
            ),
            fetchWrapper<UmamiPageviews>(
              buildProxyQuery('pageviews', startAt, endAt, tenantId, {
                unit: 'day',
                timezone: 'UTC',
              }),
            ),
            fetchWrapper<MetricEntry[]>(
              buildProxyQuery('metrics', startAt, endAt, tenantId, {
                type: 'query',
                limit: '500',
              }),
            ),
            fetchWrapper<MetricEntry[]>(
              buildProxyQuery('events/series', startAt, endAt, tenantId, {
                timezone: 'UTC',
              }),
            ),
          ]);

        const eventTotals = sumEventTotals(eventsData ?? []);
        const zeroResultsTotal = eventTotals[UmamiEvent.SearchZeroResults] ?? 0;
        const directionsTotal = eventTotals[UmamiEvent.DirectionClick] ?? 0;
        const phoneCallCount = eventTotals[UmamiEvent.PhoneClick] ?? 0;
        const websiteClicksCount = eventTotals[UmamiEvent.WebsiteClick] ?? 0;

        const { searchCount, resourceMetrics, searchByLabel } = parseMetrics(
          metricsData ?? [],
          queryMetricsData ?? [],
        );

        const resourceViewCount = resourceMetrics.reduce(
          (sum, m) => sum + m.y,
          0,
        );

        const enrichedResourceRows = await enrichWithResourceTitles(
          resourceMetrics,
          String(selectedTenantID),
        );

        setData({
          stats: statsData,
          pageviews: pvData,
          resourceRows: enrichedResourceRows,
          searchByLabel: searchByLabel,
        });
        setMetrics({
          searchCount,
          resourceViewCount,
          zeroResultsCount: zeroResultsTotal,
          directionsCount: directionsTotal,
          phoneCallsCount: phoneCallCount,
          websiteClicksCount: websiteClicksCount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [selectedTenantID],
  );

  useEffect(() => {
    fetchData(range, selectedTenantID as string | undefined);
  }, [range, fetchData, selectedTenantID]);

  const timelineData = useMemo(() => {
    if (!data.pageviews) return [];
    const fmt = range === 7 ? 'ddd' : 'DD MMM';
    return data.pageviews.pageviews.map((pv) => ({
      date: dayjs(pv.x).format(fmt),
      Pageviews: pv.y,
    }));
  }, [data.pageviews, range]);

  return (
    <Gutter>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <h1>Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DATE_RANGES.map((d) => (
            <Button
              key={d}
              buttonStyle={range === d ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setRange(d)}
            >
              Last {d} days
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <StaggeredShimmers count={5} height={80} />
      ) : error ? (
        <Banner type="error">
          <strong>Could not load analytics:</strong> {error}
        </Banner>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {data.stats !== null && (
            <StatCards
              stats={data.stats}
              searchCount={metrics.searchCount}
              resourceViewCount={metrics.resourceViewCount}
              zeroResultsCount={metrics.zeroResultsCount}
              websiteClicksCount={metrics.websiteClicksCount}
              phoneCallsCount={metrics.phoneCallsCount}
              directionsCount={metrics.directionsCount}
            />
          )}

          {data.pageviews !== null && (
            <Chart title="Pageviews" data={timelineData} />
          )}

          <MetricsTables
            resourceRows={data.resourceRows}
            searchByLabel={data.searchByLabel}
          />
        </div>
      )}
    </Gutter>
  );
};

export default AnalyticsDashboard;
