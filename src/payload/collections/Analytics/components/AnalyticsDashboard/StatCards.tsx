'use client';

import React from 'react';
import { StatCard } from './StatCard';
import type { UmamiStats } from './types';

interface StatCardsProps {
  stats: UmamiStats;
  searchCount: number;
  resourceViewCount: number;
  zeroResultsCount: number;
  websiteClicksCount: number;
  phoneCallsCount: number;
  directionsCount: number;
}

export const StatCards = React.memo(function StatCards({
  stats,
  searchCount,
  resourceViewCount,
  zeroResultsCount,
  websiteClicksCount,
  phoneCallsCount,
  directionsCount,
}: StatCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
        gap: '1rem',
      }}
    >
      <StatCard label="Total Users" value={stats.visits.toLocaleString()} />
      <StatCard label="Searches" value={searchCount.toLocaleString()} />
      <StatCard
        label="Resource Views"
        value={resourceViewCount.toLocaleString()}
      />
      <StatCard
        label="Searches with 0 Results"
        value={zeroResultsCount.toLocaleString()}
      />
      <StatCard
        label="Website Clicks"
        value={websiteClicksCount.toLocaleString()}
      />
      <StatCard
        label="Phone Calls Clicks"
        value={phoneCallsCount.toLocaleString()}
      />
      <StatCard
        label="Directions Clicks"
        value={directionsCount.toLocaleString()}
      />
      <StatCard label="Page Views" value={stats.pageviews.toLocaleString()} />
    </div>
  );
});
