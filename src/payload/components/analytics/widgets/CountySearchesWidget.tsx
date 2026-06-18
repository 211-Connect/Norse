'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { AreaSearchesTable } from '../AreaSearchesTable';
import { useAreaSearchMetrics } from '../useAnalyticsData';

export default function CountySearchesWidget() {
  const { loading, error, data } = useAreaSearchMetrics();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load county analytics.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <AreaSearchesTable
      title="Searches by county"
      areaLabel="County"
      rows={data?.countyRows ?? []}
      emptyMessage="No county search data in this period."
    />
  );
}
