'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import dynamic from 'next/dynamic';
import { analyticsDateRangeAtom } from '../DateRange';
import { useAnalytics } from '../useAnalytics';

const MAP_CENTER: [number, number] = [-98.5795, 39.8293];
const MAP_ZOOM = 3;

const AnalyticsMap = dynamic(
  () => import('../AnalyticsMap').then((mod) => mod.AnalyticsMap),
  { ssr: false },
);

export default function AnalyticsMapWidget() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  const { loading, error, data } = useAnalytics(
    range,
    selectedTenantID as string | undefined,
  );

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
        heatmapPoints={data.heatmapPoints}
      />
    </div>
  );
}
