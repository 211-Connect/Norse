'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Chart } from '../Chart';
import { usePageviews } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PageviewsChartWidget() {
  const { loading, error, data, refetch } = usePageviews();

  const timelineData = useMemo(() => {
    if (!data?.pageviews) return [];
    return data.pageviews.map((pv) => ({
      date: dayjs(pv.x).format('MMM DD'),
      Pageviews: pv.y,
    }));
  }, [data]);

  return (
    <div style={{ height: '400px' }}>
      <Chart
        title="Pageviews"
        data={timelineData}
        description={WIDGET_INFO[WidgetSlug.PageviewsChart]}
        onRefresh={refetch}
        refreshing={loading}
        loading={loading}
        errorTitle={error ? 'Could not load pageviews chart.' : undefined}
        errorDescription={
          error ? 'Please contact the support team.' : undefined
        }
      />
    </div>
  );
}
