'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Chart } from '../Chart';
import { useAnalyticsPageviews } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PageviewsChartWidget() {
  const { loading, error, data, refetch } = useAnalyticsPageviews();

  const timelineData = useMemo(() => {
    if (!data) return [];
    return data.map((pv) => ({
      date: dayjs(pv.date).format('MMM DD'),
      Pageviews: pv.hits,
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
        loading={loading && !data}
        errorTitle={error ? 'Could not load pageviews chart.' : undefined}
        errorDescription={
          error ? 'Please contact the support team.' : undefined
        }
      />
    </div>
  );
}
