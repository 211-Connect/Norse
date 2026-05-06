'use client';

import React from 'react';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import dynamic from 'next/dynamic';
import { useSessions } from '../useAnalyticsData';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('../AnalyticsMap').then((mod) => mod.AnalyticsMap),
  { ssr: false },
);

export default function AnalyticsMapWidget() {
  const { loading, error, data } = useSessions();

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
    <div style={{ height: '400px' }}>
      <AnalyticsMap
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        heatmapPoints={data?.heatmapPoints ?? []}
      />
    </div>
  );
}
