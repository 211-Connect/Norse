'use client';

import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Banner, StaggeredShimmers } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import dayjs from 'dayjs';
import { analyticsDateRangeAtom } from '../DateRange';
import { Chart } from '../Chart';
import { useAnalytics } from '../useAnalytics';

export default function PageviewsChartWidget() {
  const range = useAtomValue(analyticsDateRangeAtom);
  const { selectedTenantID } = useTenantSelection();
  const { loading, error, data } = useAnalytics(
    range,
    selectedTenantID as string | undefined,
  );

  const timelineData = useMemo(() => {
    if (!data.pageviews) return [];
    return data.pageviews.pageviews.map((pv) => ({
      date: dayjs(pv.x).format('MMM DD'),
      Pageviews: pv.y,
    }));
  }, [data.pageviews]);

  if (loading) return <StaggeredShimmers count={1} height={400} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load pageviews chart.</strong> Please contact the
        support team.
      </Banner>
    );
  }

  return (
    <div style={{ height: '400px' }}>
      <Chart title="Pageviews" data={timelineData} />
    </div>
  );
}
