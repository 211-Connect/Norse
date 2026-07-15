'use client';

import { AreaSearchesTable } from '../AreaSearchesTable';
import { useAreaSearchMetrics } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function CountySearchesWidget() {
  const { loading, error, data, refetch } = useAreaSearchMetrics();

  return (
    <AreaSearchesTable
      title="Searches by county"
      areaLabel="County"
      rows={data?.countyRows ?? []}
      emptyMessage="No county search data in this period."
      description={WIDGET_INFO[WidgetSlug.CountySearches]}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading}
      errorTitle={error ? 'Could not load county analytics.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
