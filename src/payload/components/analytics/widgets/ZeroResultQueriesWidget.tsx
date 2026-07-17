'use client';

import { MetricsTable } from '../MetricsTable';
import { useAnalyticsZeroResultQueries } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ZeroResultQueriesWidget() {
  const { loading, error, data, refetch } = useAnalyticsZeroResultQueries();

  const rows = (data ?? []).map((r) => ({ x: r.query, y: r.hits }));

  return (
    <MetricsTable
      title="No result searches"
      description={WIDGET_INFO[WidgetSlug.ZeroResultQueries]}
      colLabel="Query"
      colValue="Count"
      rows={rows}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading && !data}
      errorTitle={error ? 'Could not load zero-result queries.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
