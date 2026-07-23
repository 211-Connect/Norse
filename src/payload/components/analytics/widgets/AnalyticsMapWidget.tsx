'use client';

import dynamic from 'next/dynamic';

import { useAnalyticsHeatmap } from '../useAnalyticsData';
import { WidgetCard } from '../WidgetCard';
import { WidgetErrorState } from '../WidgetErrorState';
import { WidgetSkeleton } from '../WidgetSkeleton';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('../AnalyticsMap').then((mod) => mod.AnalyticsMap),
  { ssr: false },
);

export default function AnalyticsMapWidget() {
  const { loading, error, data, refetch } = useAnalyticsHeatmap();

  if (loading && !data) {
    return <WidgetSkeleton height={400} count={1} shimmerHeight={400} />;
  }

  if (error) {
    return (
      <WidgetErrorState
        title="Could not load analytics map."
        description="Please contact the support team."
        onRetry={refetch}
        retrying={loading}
      />
    );
  }

  return (
    <WidgetCard
      title="Heat Map"
      description={WIDGET_INFO[WidgetSlug.Map]}
      headingLevel="h3"
    >
      <div style={{ height: '400px' }}>
        <AnalyticsMap
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          heatmapPoints={data ?? []}
        />
      </div>
    </WidgetCard>
  );
}
