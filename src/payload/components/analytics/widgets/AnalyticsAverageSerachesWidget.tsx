'use client';

import { usePaths, useSessions } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';

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
  };
}

export default function AnalyticsAverageSearchesWidget() {
  return (
    <SingleStatCardWidget
      label="Average Searches / Session"
      dataSource="custom"
      useData={useAverageSearchesData}
      selector={(data) => data as AverageSearchesData}
      formatValue={(value) => value.toFixed(2)}
    />
  );
}
