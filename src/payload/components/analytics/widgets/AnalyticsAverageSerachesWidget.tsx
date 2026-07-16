'use client';

import { usePaths, useSessions } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

type AverageSearchesData = {
  current: number;
  previous: number;
};

function useAverageSearchesData() {
  const paths = usePaths();
  const sessions = useSessions();

  const currentSearchCount = paths.data?.searchCount ?? 0;
  const currentSessionCount = sessions.data?.sessions?.length ?? 0;

  const data: AverageSearchesData = {
    current:
      currentSessionCount > 0 ? currentSearchCount / currentSessionCount : 0,
    previous: 0,
  };

  return {
    loading: paths.loading || sessions.loading,
    error: paths.error ?? sessions.error,
    data,
    refetch: () => {
      paths.refetch();
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
