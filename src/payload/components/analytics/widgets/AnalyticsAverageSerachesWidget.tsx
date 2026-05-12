'use client';

import React from 'react';

import { usePageviews, usePaths } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';

type AverageSearchesData = {
  current: number;
  previous: number;
};

function useAverageSearchesData() {
  const paths = usePaths();
  const pageviews = usePageviews();

  const currentSearchCount = paths.data?.searchCount ?? 0;
  const currentSessionCount =
    pageviews.data?.sessions?.reduce((sum, session) => sum + session.y, 0) ?? 0;

  const data: AverageSearchesData = {
    current:
      currentSessionCount > 0 ? currentSearchCount / currentSessionCount : 0,
    previous: 0,
  };

  return {
    loading: paths.loading || pageviews.loading,
    error: paths.error ?? pageviews.error,
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
