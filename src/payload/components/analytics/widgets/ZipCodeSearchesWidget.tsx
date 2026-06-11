'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { AreaSearchesTable } from '../AreaSearchesTable';
import { useAreaSearchMetrics } from '../useAnalyticsData';

export default function ZipCodeSearchesWidget() {
  const { loading, error, data } = useAreaSearchMetrics();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load zip code analytics.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <AreaSearchesTable
      title="Searches by zip code"
      areaLabel="Zip code"
      rows={data?.zipCodeRows ?? []}
      emptyMessage="No zip code search data in this period."
    />
  );
}
