'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Chart } from '../Chart';
import { usePageviews } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PageviewsChartWidget() {
  const { loading, error, data } = usePageviews();

  const timelineData = useMemo(() => {
    if (!data?.pageviews) return [];
    return data.pageviews.map((pv) => ({
      date: dayjs(pv.x).format('MMM DD'),
      Pageviews: pv.y,
    }));
  }, [data]);

  if (loading) return <StaggeredShimmers count={1} height={400} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load pageviews chart.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <div style={{ height: '400px' }}>
      <Chart
        title="Pageviews"
        data={timelineData}
        description={WIDGET_INFO[WidgetSlug.PageviewsChart]}
      />
    </div>
  );
}
