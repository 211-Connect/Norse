'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { PieChartWidget, PieChartWidgetSegment } from '../PieChartWidget';
import { UmamiSession } from '../types';
import { useSessions } from '../useAnalyticsData';
import { WidgetInfoButton } from '../WidgetInfoButton';

type SessionsPieWidgetProps = {
  buildSegments: (sessions: UmamiSession[]) => PieChartWidgetSegment[];
  errorTitle: string;
  errorDescription?: string;
  shimmerHeight?: number;
  title?: string;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {title && (
        <h4
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--theme-text)',
          }}
        >
          {title}
          <WidgetInfoButton description={description} />
        </h4>
      )}
      <PieChartWidget segments={buildSegments(sessions)} />
    </div>
  );
}
