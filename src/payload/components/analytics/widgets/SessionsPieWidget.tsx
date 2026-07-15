'use client';

import { StaggeredShimmers } from '@payloadcms/ui';

import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { UmamiSession } from '../types';
import { useSessions } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';

type SessionsPieWidgetProps = {
  buildSegments: (sessions: UmamiSession[]) => PieChartWidgetSegment[];
  errorTitle: string;
  errorDescription?: string;
  shimmerHeight?: number;
  title: string;
  description?: string;
};

export function SessionsPieWidget({
  buildSegments,
  errorTitle,
  errorDescription,
  shimmerHeight = 220,
  title,
  description,
}: SessionsPieWidgetProps) {
  const { loading, error, data, refetch } = useSessions();

  const sessions = data?.sessions ?? [];

  if (error) {
    return (
      <WidgetErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={refetch}
        retrying={loading}
      />
    );
  }

  return (
    <WidgetCard title={title} description={description}>
      {loading ? (
        <StaggeredShimmers count={1} height={shimmerHeight} />
      ) : (
        <PieChartWidget segments={buildSegments(sessions)} />
      )}
    </WidgetCard>
  );
}
