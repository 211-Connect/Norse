'use client';

import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { type CSSProperties, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CrawlerTrafficCountsDto } from '../../../../lib/api/generated/data-contracts';
import { analyticsDateRangeAtom } from '../DateRange';
import type { CrawlerTrafficGranularity } from '../analyticsCache';
import type { DateRange } from '../types';
import { useAnalyticsCrawlerTraffic } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

/** Norse-API allows hourly buckets for ranges up to this many days. */
const MAX_HOURLY_RANGE_DAYS = 31;
const TOP_ROWS = 15;

type OutcomeKey = keyof Omit<CrawlerTrafficCountsDto, 'total'>;

const OUTCOMES: { key: OutcomeKey; label: string; color: string }[] = [
  { key: 'blocked', label: 'Blocked', color: '#b91c1c' },
  { key: 'rateLimited', label: 'Rate limited', color: '#ea580c' },
  { key: 'logged', label: 'Logged', color: '#ca8a04' },
  { key: 'shed', label: 'Busy', color: '#7c3aed' },
  { key: 'allowed', label: 'Allowed', color: '#15803d' },
];

const TYPE_LABELS: Record<string, string> = {
  seo: 'SEO',
  nefarious: 'Scraper / AI / tool',
  unknown: 'Other',
};

function rangeDays(range: DateRange): number {
  if (typeof range === 'number') return range;
  return dayjs.utc(range.end).diff(dayjs.utc(range.start), 'day') + 1;
}

function crawlerLabel(crawler: string): string {
  return crawler === '' ? 'Unidentified' : crawler;
}

const toggleStyle = (active: boolean, disabled = false): CSSProperties => ({
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: '0.375rem',
  padding: '0.25rem 0.625rem',
  fontSize: '0.8125rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  background: active
    ? 'var(--theme-elevation-150)'
    : 'var(--theme-elevation-0)',
  fontWeight: active ? 600 : 400,
});

const cellStyle: CSSProperties = {
  padding: '0.375rem 0.5rem',
  borderBottom: '1px solid var(--theme-elevation-100)',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
const firstCellStyle: CSSProperties = { ...cellStyle, textAlign: 'left' };

function CountsTable({
  firstHeading,
  rows,
}: {
  firstHeading: string;
  rows: {
    key: string;
    label: string;
    detail?: string;
    counts: CrawlerTrafficCountsDto;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
        Nothing counted in this period.
      </p>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr>
            <th style={firstCellStyle}>{firstHeading}</th>
            {OUTCOMES.map((outcome) => (
              <th key={outcome.key} style={cellStyle}>
                {outcome.label}
              </th>
            ))}
            <th style={cellStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td style={firstCellStyle}>
                {row.label}
                {row.detail && (
                  <span
                    style={{
                      color: 'var(--theme-elevation-500)',
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    {row.detail}
                  </span>
                )}
              </td>
              {OUTCOMES.map((outcome) => (
                <td key={outcome.key} style={cellStyle}>
                  {row.counts[outcome.key].toLocaleString()}
                </td>
              ))}
              <td style={{ ...cellStyle, fontWeight: 600 }}>
                {row.counts.total.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The selected tenant's requests per crawler and outcome, from Norse's
 * hourly counters (not Umami).
 */
export default function CrawlerTrafficWidget() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const hourlyAllowed = rangeDays(range) <= MAX_HOURLY_RANGE_DAYS;

  const [preferHourly, setPreferHourly] = useState(true);
  const granularity: CrawlerTrafficGranularity =
    preferHourly && hourlyAllowed ? 'hour' : 'day';

  const { loading, error, data, refetch } =
    useAnalyticsCrawlerTraffic(granularity);

  const series = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        bucket: dayjs
          .utc(point.bucket)
          .format(granularity === 'hour' ? 'MMM DD HH:00' : 'MMM DD'),
        ...Object.fromEntries(
          OUTCOMES.map((outcome) => [outcome.label, point[outcome.key]]),
        ),
      })),
    [data, granularity],
  );

  const crawlerRows = useMemo(
    () =>
      (data?.byCrawler ?? []).slice(0, TOP_ROWS).map((row) => ({
        key: `${row.crawler}|${row.classification}`,
        label: crawlerLabel(row.crawler),
        detail: TYPE_LABELS[row.classification] ?? row.classification,
        counts: row,
      })),
    [data],
  );

  if (loading && !data) {
    return <WidgetSkeleton height="640px" count={1} shimmerHeight={560} />;
  }
  if (error) {
    return (
      <WidgetErrorState
        title="Could not load crawler traffic."
        description="Please contact the support team."
        onRetry={refetch}
        retrying={loading}
      />
    );
  }

  return (
    <WidgetCard
      title="Crawler traffic"
      description={WIDGET_INFO[WidgetSlug.CrawlerTraffic]}
      bordered
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            style={toggleStyle(granularity === 'hour', !hourlyAllowed)}
            onClick={() => setPreferHourly(true)}
            disabled={!hourlyAllowed}
            aria-pressed={granularity === 'hour'}
            title={
              hourlyAllowed
                ? undefined
                : `Hourly is available for ranges up to ${MAX_HOURLY_RANGE_DAYS} days`
            }
          >
            Hourly
          </button>
          <button
            type="button"
            style={toggleStyle(granularity === 'day')}
            onClick={() => setPreferHourly(false)}
            aria-pressed={granularity === 'day'}
          >
            Daily
          </button>
        </div>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.875rem',
            color: 'var(--theme-elevation-600)',
          }}
        >
          {(data?.totals.total ?? 0).toLocaleString()} requests counted
        </span>
      </div>

      <div style={{ height: '320px' }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 1, height: 1 }}
        >
          <BarChart
            data={series}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} minTickGap={16} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {OUTCOMES.map((outcome) => (
              <Bar
                key={outcome.key}
                dataKey={outcome.label}
                stackId="outcome"
                fill={outcome.color}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h4 style={{ margin: '0.5rem 0 0', fontSize: '0.9375rem' }}>
        Top crawlers
      </h4>
      <CountsTable firstHeading="Crawler" rows={crawlerRows} />
    </WidgetCard>
  );
}
