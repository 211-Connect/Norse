'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { UmamiSession } from '../types';
import { useSessions } from '../useAnalyticsData';

type SessionsPieWidgetProps = {
  buildSegments: (sessions: UmamiSession[]) => PieChartWidgetSegment[];
  errorTitle: string;
  errorDescription?: string;
  shimmerHeight?: number;
};

export function SessionsPieWidget({
  buildSegments,
  errorTitle,
  errorDescription,
  shimmerHeight = 220,
}: SessionsPieWidgetProps) {
  const { loading, error, data } = useSessions();

  if (loading) return <StaggeredShimmers count={1} height={shimmerHeight} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>{errorTitle}</strong>
        {errorDescription ? ` ${errorDescription}` : null}
      </Banner>
    );
  }

  const sessions = data?.sessions ?? [];

  return <PieChartWidget segments={buildSegments(sessions)} />;
}
