'use client';

import { MetricsTable } from '../MetricsTable';
import { useZeroResultQueries } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ZeroResultQueriesWidget() {
  const { loading, error, data, refetch } = useZeroResultQueries();

  return (
    <MetricsTable
      title="No result searches"
      description={WIDGET_INFO[WidgetSlug.ZeroResultQueries]}
      colLabel="Query"
      colValue="Count"
      rows={data?.zeroResultQueries ?? []}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading}
      errorTitle={error ? 'Could not load zero-result queries.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
