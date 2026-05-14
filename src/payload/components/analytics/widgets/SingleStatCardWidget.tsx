'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { StatCard } from '../StatCard';
import type { EventsData, PathsData } from '../analyticsCache';
import type { UmamiStats } from '../types';
import { useEvents, usePaths, useStats } from '../useAnalyticsData';
import type { AsyncData } from '../useAnalyticsData';

type Metric = { current: number; previous: number };

type StatsSelector = (data: UmamiStats) => Metric | null;
type PathsSelector = (data: PathsData) => Metric | null;
type EventsSelector = (data: EventsData) => Metric | null;

export type SingleStatCardWidgetProps =
  | { label: string; dataSource: 'stats'; selector: StatsSelector }
  | { label: string; dataSource: 'paths'; selector: PathsSelector }
  | { label: string; dataSource: 'events'; selector: EventsSelector }
  | {
      label: string;
      dataSource: 'custom';
      useData: () => AsyncData<unknown>;
      selector: (data: unknown) => Metric | null;
      formatValue?: (value: number) => string;
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
}: {
  label: string;
  useData: () => AsyncData<T>;
  selector: (data: T) => Metric | null;
  formatValue?: (value: number) => string;
}) {
  const { loading, error, data } = useData();

  if (loading) return <StaggeredShimmers count={1} height={80} />;
  if (error)
    return (
      <Banner type="error">
        <strong>Could not load {label}.</strong>
      </Banner>
    );

  const metric = data ? selector(data) : null;
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
      />
    );
  if (props.dataSource === 'stats')
    return (
      <StatCardFromData
        label={props.label}
        useData={useStats}
        selector={props.selector}
      />
    );
  if (props.dataSource === 'paths')
    return (
      <StatCardFromData
        label={props.label}
        useData={usePaths}
        selector={props.selector}
      />
    );
  return (
    <StatCardFromData
      label={props.label}
      useData={useEvents}
      selector={props.selector}
    />
  );
}
