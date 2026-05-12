'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { MetricsTable } from '../MetricsTable';
import { usePaths } from '../useAnalyticsData';

export default function SearchQueriesWidget() {
  const { loading, error, data } = usePaths();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load search queries.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <MetricsTable
      title="Searches by Query Label"
      colLabel="Query Label"
      colValue="Searches"
      rows={data?.searchByLabel ?? []}
    />
  );
}
