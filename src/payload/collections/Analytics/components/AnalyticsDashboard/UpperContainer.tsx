'use client';

import React from 'react';
import { Chart, type LineChartDataPoint } from './Chart';
import type { HeatmapPoint } from './AnalyticsMap';
import dynamic from 'next/dynamic';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('./AnalyticsMap').then((mod) => mod.AnalyticsMap),
  {
    ssr: false,
  },
);

interface Props {
  hasPageviews: boolean;
  timelineData: LineChartDataPoint[];
  heatmapPoints?: HeatmapPoint[];
}

export const UpperContainer = React.memo(function UpperContainer({
  hasPageviews,
  timelineData,
  heatmapPoints,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, height: '400px' }}>
        {hasPageviews && <Chart title="Pageviews" data={timelineData} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, height: '400px' }}>
        <AnalyticsMap
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          heatmapPoints={heatmapPoints}
        />
      </div>
    </div>
  );
});
