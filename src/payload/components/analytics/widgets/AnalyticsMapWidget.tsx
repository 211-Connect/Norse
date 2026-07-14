'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import dynamic from 'next/dynamic';

import { useSessionHeatmap } from '../useAnalyticsData';
import { WidgetInfoButton } from '../WidgetInfoButton';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('../AnalyticsMap').then((mod) => mod.AnalyticsMap),
  { ssr: false },
);

export default function AnalyticsMapWidget() {
  const { loading, error, data } = useSessionHeatmap();

  if (loading) return <StaggeredShimmers count={1} height={400} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load analytics map.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <h3
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        Heat Map
        <WidgetInfoButton description={WIDGET_INFO[WidgetSlug.Map]} />
      </h3>
      <div style={{ height: '400px' }}>
        <AnalyticsMap
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          heatmapPoints={data?.heatmapPoints ?? []}
        />
      </div>
    </div>
  );
}
