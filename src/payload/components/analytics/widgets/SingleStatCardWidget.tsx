'use client';

import type { StatsResponse } from '../../../../lib/api/generated/data-contracts';
import { StatCard } from '../StatCard';
import {
  AnalyticsMetricsWithTrend,
  AsyncData,
  useAnalyticsMetrics,
  useAnalyticsStats,
} from '../useAnalyticsData';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';

type Metric = { current: number; previous: number };

type StatsSelector = (data: StatsResponse) => Metric | null;
type MetricsSelector = (data: AnalyticsMetricsWithTrend) => Metric | null;

export type SingleStatCardWidgetProps =
  | {
      label: string;
      dataSource: 'stats';
      selector: StatsSelector;
      description?: string;
    }
  | {
      label: string;
      dataSource: 'metrics';
      selector: MetricsSelector;
      description?: string;
    }
  | {
      label: string;
      dataSource: 'custom';
      useData: () => AsyncData<unknown>;
      selector: (data: unknown) => Metric | null;
      formatValue?: (value: number) => string;
      description?: string;
    };

function toTrend(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

function StatCardFromData<T>({
  label,
  useData,
  selector,
  formatValue,
  description,
}: {
  label: string;
  useData: () => AsyncData<T>;
  selector: (data: T) => Metric | null;
  formatValue?: (value: number) => string;
  description?: string;
}) {
  const { loading, error, data, refetch } = useData();

  const metric = data ? selector(data) : null;

  if (error) {
    return (
      <WidgetErrorState
        title={`Could not load ${label}.`}
        onRetry={refetch}
        retrying={loading}
      />
    );
  }

  if (loading && !data) {
    return <WidgetSkeleton height={80} count={1} shimmerHeight={56} />;
  }
  if (!metric) return null;

  return (
    <StatCard
      label={label}
      value={
        formatValue
          ? formatValue(metric.current)
          : metric.current.toLocaleString()
      }
      trend={toTrend(metric.current, metric.previous)}
      description={description}
    />
  );
}

export function SingleStatCardWidget(props: SingleStatCardWidgetProps) {
  if (props.dataSource === 'custom')
    return (
      <StatCardFromData
        label={props.label}
        useData={props.useData}
        selector={props.selector}
        formatValue={props.formatValue}
        description={props.description}
      />
    );
  if (props.dataSource === 'stats')
    return (
      <StatCardFromData
        label={props.label}
        useData={useAnalyticsStats}
        selector={props.selector}
        description={props.description}
      />
    );
  if (props.dataSource === 'metrics')
    return (
      <StatCardFromData
        label={props.label}
        useData={useAnalyticsMetrics}
        selector={props.selector}
        description={props.description}
      />
    );
  return null;
}
