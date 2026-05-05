'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { analyticsDateRangeAtom } from '../DateRange';
import { MetricsTable } from '../MetricsTable';
import { useAnalytics } from '../useAnalytics';

export default function ResourceTitlesWidget() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  const { loading, error, data } = useAnalytics(
    range,
    selectedTenantID as string | undefined,
  );

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
      rows={data.resourceRows}
    />
  );
}
