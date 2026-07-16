'use client';

import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { UmamiSession } from '../types';
import { useSessions } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';

type SessionsPieWidgetProps = {
  buildSegments: (sessions: UmamiSession[]) => PieChartWidgetSegment[];
  errorTitle: string;
  errorDescription?: string;
  title: string;
  description?: string;
};

export function SessionsPieWidget({
  buildSegments,
  errorTitle,
  errorDescription,
  title,
  description,
}: SessionsPieWidgetProps) {
  const { loading, error, data, refetch } = useSessions();

  if (loading) {
    return <WidgetSkeleton height={220} count={1} shimmerHeight={180} />;
  }

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
      <PieChartWidget segments={buildSegments(sessions)} />
    </WidgetCard>
  );
}
