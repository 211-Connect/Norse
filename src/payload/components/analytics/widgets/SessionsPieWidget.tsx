'use client';

import type { SessionsResponse } from '../../../../lib/api/generated/data-contracts';
import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { useAnalyticsSessions } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';

type SessionsPieWidgetProps = {
  buildSegments: (sessions: SessionsResponse[]) => PieChartWidgetSegment[];
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
  const { loading, error, data, refetch } = useAnalyticsSessions();

  if (loading && !data) {
    return <WidgetSkeleton height={220} count={1} shimmerHeight={180} />;
  }

  const sessions = data?.data ?? [];

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
