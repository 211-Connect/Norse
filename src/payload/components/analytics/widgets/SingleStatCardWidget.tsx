'use client';

import React from 'react';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useStats, usePaths, useEvents } from '../useAnalyticsData';
import { StatCard } from '../StatCard';
import type { UmamiStats } from '../types';
import type { PathsData, EventsData } from '../analyticsCache';

function toTrend(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

type StatsSelector = (
  stats: UmamiStats,
) => { current: number; previous: number } | null;

interface StatsStatCardProps {
  label: string;
  dataSource: 'stats';
  selector: StatsSelector;
}

function StatCardFromStats({ label, selector }: StatsStatCardProps) {
  const { loading, error, data } = useStats();
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
      value={metric.current.toLocaleString()}
      trend={toTrend(metric.current, metric.previous)}
    />
  );
}

type PathsSelector = (
  paths: PathsData,
) => { current: number; previous: number } | null;

interface PathsStatCardProps {
  label: string;
  dataSource: 'paths';
  selector: PathsSelector;
}

function StatCardFromPaths({ label, selector }: PathsStatCardProps) {
  const { loading, error, data } = usePaths();
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
      value={metric.current.toLocaleString()}
      trend={toTrend(metric.current, metric.previous)}
    />
  );
}

type EventsSelector = (
  events: EventsData,
) => { current: number; previous: number } | null;

interface EventsStatCardProps {
  label: string;
  dataSource: 'events';
  selector: EventsSelector;
}

function StatCardFromEvents({ label, selector }: EventsStatCardProps) {
  const { loading, error, data } = useEvents();
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
      value={metric.current.toLocaleString()}
      trend={toTrend(metric.current, metric.previous)}
    />
  );
}

export type SingleStatCardWidgetProps =
  | StatsStatCardProps
  | PathsStatCardProps
  | EventsStatCardProps;

export function SingleStatCardWidget(props: SingleStatCardWidgetProps) {
  if (props.dataSource === 'stats') return <StatCardFromStats {...props} />;
  if (props.dataSource === 'paths') return <StatCardFromPaths {...props} />;
  return <StatCardFromEvents {...props} />;
}
