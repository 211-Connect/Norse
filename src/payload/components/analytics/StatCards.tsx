'use client';

import React from 'react';

import { StatCard } from './StatCard';
import type { UmamiStats } from './types';
import type { AnalyticsMetrics, Metric } from './useAnalytics';

interface StatCardsProps {
  stats: UmamiStats;
  metrics: AnalyticsMetrics;
}

function toTrend({ current, previous }: Metric) {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

export const StatCards = React.memo(function StatCards({
  stats,
  metrics,
}: StatCardsProps) {
  const cards = [
    {
      label: 'Total Users',
      metric: { current: stats.visitors, previous: stats.comparison.visitors },
    },
    { label: 'Searches', metric: metrics.searches },
    { label: 'Resource Views', metric: metrics.resourceViews },
    { label: 'Searches with 0 Results', metric: metrics.zeroResults },
    { label: 'Website Clicks', metric: metrics.websiteClicks },
    { label: 'Phone Calls Clicks', metric: metrics.phoneCalls },
    { label: 'Directions Clicks', metric: metrics.directions },
    { label: 'Widget Searches', metric: metrics.widgetSearches },
    {
      label: 'Page Views',
      metric: {
        current: stats.pageviews,
        previous: stats.comparison.pageviews,
      },
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
        gap: '1rem',
        justifyItems: 'center',
      }}
    >
      {cards.map(({ label, metric }) => (
        <StatCard
          key={label}
          label={label}
          value={metric.current.toLocaleString()}
          trend={toTrend(metric)}
        />
      ))}
    </div>
  );
});
