'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import type {
  DateRange,
  UmamiStats,
  UmamiPageviews,
  MetricEntry,
  ResourceRow,
} from './types';
import {
  buildProxyQuery,
  enrichWithResourceTitles,
  fetchJson,
  parseMetrics,
  sumEventTotals,
} from './utils';
import { StatCards } from './StatCards';
import { MetricsTables } from './MetricsTables';
import { Chart } from './Chart';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Banner, Button, Gutter, StaggeredShimmers } from '@payloadcms/ui';
import { UmamiEvent } from '../../../../../app/(app)/shared/lib/umami';

const DATE_RANGES: DateRange[] = [7, 30, 90];

const AnalyticsDashboard = () => {
  const { selectedTenantID } = useTenantSelection();
  const [range, setRange] = useState<DateRange>(30);
  const [pageviews, setPageviews] = useState<UmamiPageviews | null>(null);
  const [stats, setStats] = useState<UmamiStats | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [resourceViewCount, setResourceViewCount] = useState(0);
  const [zeroResultsCount, setZeroResultsCount] = useState(0);
  const [directionsCount, setDirectionsCount] = useState(0);
  const [phoneCallsCount, setPhoneCallsCount] = useState(0);
  const [websiteClicksCount, setWebsiteClicksCount] = useState(0);
  const [resourceRows, setResourceRows] = useState<MetricEntry[]>([]);
  const [searchByLabel, setSearchByLabel] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (days: DateRange, tenantId: string | undefined) => {
      setLoading(true);
      setError(null);

      const endAt = dayjs().valueOf();
      const startAt = dayjs().subtract(days, 'day').valueOf();

      try {
        const [statsData, metricsData, pvData, queryMetricsData, eventsData] =
          await Promise.all([
            fetchJson<UmamiStats>(
              buildProxyQuery('stats', startAt, endAt, tenantId),
            ),
            fetchJson<MetricEntry[]>(
              buildProxyQuery('metrics', startAt, endAt, tenantId, {
                type: 'path',
                limit: '500',
              }),
            ),
            fetchJson<UmamiPageviews>(
              buildProxyQuery('pageviews', startAt, endAt, tenantId, {
                unit: 'day',
                timezone: 'UTC',
              }),
            ),
            fetchJson<MetricEntry[]>(
              buildProxyQuery('metrics', startAt, endAt, tenantId, {
                type: 'query',
                limit: '500',
              }),
            ),
            fetchJson<MetricEntry[]>(
              buildProxyQuery('events/series', startAt, endAt, tenantId, {
                timezone: 'UTC',
              }),
            ),
          ]);

        const eventTotals = sumEventTotals(eventsData);
        const zeroResultsTotal = eventTotals[UmamiEvent.SearchZeroResults] ?? 0;
        const directionsTotal = eventTotals[UmamiEvent.DirectionClick] ?? 0;
        const phoneCallCount = eventTotals[UmamiEvent.PhoneClick] ?? 0;
        const websiteClicksCount = eventTotals[UmamiEvent.WebsiteClick] ?? 0;

        const { searchCount, resourceMetrics, searchByLabel } = parseMetrics(
          metricsData,
          queryMetricsData,
        );

        const resourceViewCount = resourceMetrics.reduce(
          (sum, m) => sum + m.y,
          0,
        );

        const enrichedResourceRows = await enrichWithResourceTitles(
          resourceMetrics,
          String(selectedTenantID),
        );

        setStats(statsData);
        setSearchCount(searchCount);
        setResourceViewCount(resourceViewCount);
        setZeroResultsCount(zeroResultsTotal);
        setDirectionsCount(directionsTotal);
        setPhoneCallsCount(phoneCallCount);
        setWebsiteClicksCount(websiteClicksCount);
        setResourceRows(enrichedResourceRows);
        setSearchByLabel(searchByLabel);
        setPageviews(pvData);
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

  // Derived state computed during render, memoized to avoid recomputing on unrelated updates
  // (rerender-derived-state-no-effect)
  const timelineData = useMemo(() => {
    if (!pageviews) return [];
    const fmt = range === 7 ? 'ddd' : 'DD MMM';
    return pageviews.pageviews.map((pv) => ({
      date: dayjs(pv.x).format(fmt),
      Pageviews: pv.y,
    }));
  }, [pageviews, range]);

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
          {stats !== null && (
            <StatCards
              stats={stats}
              searchCount={searchCount}
              resourceViewCount={resourceViewCount}
              zeroResultsCount={zeroResultsCount}
              websiteClicksCount={websiteClicksCount}
              phoneCallsCount={phoneCallsCount}
              directionsCount={directionsCount}
            />
          )}

          {pageviews !== null && (
            <Chart title="Pageviews" data={timelineData} />
          )}

          <MetricsTables
            resourceRows={resourceRows}
            searchByLabel={searchByLabel}
          />
        </div>
      )}
    </Gutter>
  );
};

export default AnalyticsDashboard;
