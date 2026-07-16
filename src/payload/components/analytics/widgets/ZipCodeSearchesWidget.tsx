'use client';

import { AreaSearchesTable } from '../AreaSearchesTable';
import { useAreaSearchMetrics } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ZipCodeSearchesWidget() {
  const { loading, error, data, refetch } = useAreaSearchMetrics();

  return (
    <AreaSearchesTable
      title="Searches by zip code"
      areaLabel="Zip code"
      rows={data?.zipCodeRows ?? []}
      emptyMessage="No zip code search data in this period."
      description={WIDGET_INFO[WidgetSlug.ZipCodeSearches]}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading}
      errorTitle={error ? 'Could not load zip code analytics.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
