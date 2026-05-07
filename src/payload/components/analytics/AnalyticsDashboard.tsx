'use client';

import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import type { DateRange } from './types';
import { useAnalytics } from './useAnalytics';
import { StatCards } from './StatCards';
import { LowerContainer } from './LowerContainer';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { Banner, Button, Gutter, StaggeredShimmers } from '@payloadcms/ui';
import { UpperContainer } from './UpperContainer';

const DATE_RANGES: DateRange[] = [7, 30, 90];

const AnalyticsDashboard = () => {
  const { selectedTenantID } = useTenantSelection();
  const [range, setRange] = useState<DateRange>(30);

  const {
    loading,
    error,
    data: {
      stats,
      pageviews,
      resourceRows,
      searchByLabel,
      metrics,
      heatmapPoints,
    },
  } = useAnalytics(range, selectedTenantID as string | undefined);

  const timelineData = useMemo(() => {
    if (!pageviews) return [];
    return pageviews.pageviews.map((pv) => ({
      date: dayjs(pv.x).format('MMM DD'),
      Pageviews: pv.y,
    }));
  }, [pageviews]);

  return (
    <Gutter>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <h1>Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DATE_RANGES.map((d) => (
            <Button
              key={d}
              buttonStyle={range === d ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setRange(d)}
            >
              Last {d} days
            </Button>
          ))}
        </div>
      </div>
      {loading ? (
        <StaggeredShimmers count={5} height={80} />
      ) : error ? (
        <Banner type="error">
          <strong>Could not load analytics.</strong>{' '}
          {'Please contact the support team.'}
        </Banner>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {stats !== null && <StatCards stats={stats} metrics={metrics} />}

          <UpperContainer
            timelineData={timelineData}
            heatmapPoints={heatmapPoints}
          />

          <LowerContainer
            resourceRows={resourceRows}
            searchByLabel={searchByLabel}
          />
        </div>
      )}
    </Gutter>
  );
};

export default AnalyticsDashboard;
