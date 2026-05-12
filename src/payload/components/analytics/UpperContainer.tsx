'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import { Chart, type LineChartDataPoint } from './Chart';
import { HeatmapPoint } from './types';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('./AnalyticsMap').then((mod) => mod.AnalyticsMap),
  {
    ssr: false,
  },
);

interface Props {
  timelineData: LineChartDataPoint[];
  heatmapPoints: HeatmapPoint[];
}

export const UpperContainer = React.memo(function UpperContainer({
  timelineData,
  heatmapPoints,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, height: '400px' }}>
        {<Chart title="Pageviews" data={timelineData} />}
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
