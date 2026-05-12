'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import React from 'react';

import { MetricsTable } from '../MetricsTable';
import { usePaths } from '../useAnalyticsData';

export default function ResourceTitlesWidget() {
  const { loading, error, data } = usePaths();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load resource titles.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <MetricsTable
      title="Resource Titles"
      colLabel="Path"
      colValue="Referrals"
      rows={data?.resourceRows ?? []}
    />
  );
}
