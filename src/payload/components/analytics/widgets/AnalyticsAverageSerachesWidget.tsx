'use client';

import { useAnalyticsMetrics, useAnalyticsSessions } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

type AverageSearchesData = {
  current: number;
  previous: number;
};

function useAverageSearchesData() {
  const metrics = useAnalyticsMetrics();
  const sessions = useAnalyticsSessions();

  const currentSearchCount = metrics.data?.current.searches ?? 0;
  const currentSessionCount = sessions.data?.data?.length ?? 0;

  const data: AverageSearchesData = {
    current:
      currentSessionCount > 0 ? currentSearchCount / currentSessionCount : 0,
    previous: 0,
  };

  return {
    loading: metrics.loading || sessions.loading,
    error: metrics.error ?? sessions.error,
    data,
    refetch: () => {
      metrics.refetch();
      sessions.refetch();
    },
  };
}

export default function AnalyticsAverageSearchesWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.AverageSearches]}
      label="Average Searches / Session"
      dataSource="custom"
      useData={useAverageSearchesData}
      selector={(data) => data as AverageSearchesData}
      formatValue={(value) => value.toFixed(2)}
    />
  );
}
