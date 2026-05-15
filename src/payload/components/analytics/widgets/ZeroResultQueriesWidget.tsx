'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { MetricsTable } from '../MetricsTable';
import { useZeroResultQueries } from '../useAnalyticsData';

export default function ZeroResultQueriesWidget() {
  const { loading, error, data } = useZeroResultQueries();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load zero-result queries.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <MetricsTable
      title="No result searches"
      colLabel="Query"
      colValue="Referrals"
      rows={data?.zeroResultQueries ?? []}
    />
  );
}
