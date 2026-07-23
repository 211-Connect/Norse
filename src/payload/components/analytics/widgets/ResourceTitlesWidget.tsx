'use client';

import { MetricsTable } from '../MetricsTable';
import type { MetricEntry } from '../types';
import { useAnalyticsResourceMetrics } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ResourceTitlesWidget() {
  const { loading, error, data, refetch } = useAnalyticsResourceMetrics();

  const rows: MetricEntry[] = (data ?? []).map((r) => ({
    x: r.title,
    y: r.views,
  }));

  return (
    <MetricsTable
      title="Resource clicks"
      description={WIDGET_INFO[WidgetSlug.ResourceTitles]}
      colLabel="Resource"
      colValue="Referrals"
      rows={rows}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading && !data}
      errorTitle={error ? 'Could not load resource titles.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
