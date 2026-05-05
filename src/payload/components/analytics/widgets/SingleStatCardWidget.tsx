'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { analyticsDateRangeAtom } from '../DateRange';
import { AnalyticsData, useAnalytics } from '../useAnalytics';
import { StatCard } from '../StatCard';

type MetricSelector = (
  data: AnalyticsData,
) => { current: number; previous: number } | null;

function toTrend(current: number, previous: number): number | undefined {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

interface SingleStatCardWidgetProps {
  label: string;
  selector: MetricSelector;
}

export function SingleStatCardWidget({
  label,
  selector,
}: SingleStatCardWidgetProps) {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  const { loading, error, data } = useAnalytics(
    range,
    selectedTenantID as string | undefined,
  );

  if (loading) return <StaggeredShimmers count={1} height={80} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load {label}.</strong>
      </Banner>
    );
  }

  const metric = selector(data);
  if (!metric) return null;

  return (
    <StatCard
      label={label}
      value={metric.current.toLocaleString()}
      trend={toTrend(metric.current, metric.previous)}
    />
  );
}
