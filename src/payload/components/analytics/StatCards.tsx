'use client';

import React from 'react';

import { StatCard } from './StatCard';
import type { AnalyticsMetrics, Metric, UmamiStats } from './types';

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
  const cards: { label: string; metric: Metric; format?: (n: number) => string }[] = [
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
      label: 'Avg. Searches / Session',
      metric: metrics.avgSearchesPerSession,
      format: (n) => n.toFixed(1),
    },
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
      {cards.map(({ label, metric, format }) => (
        <StatCard
          key={label}
          label={label}
          value={format ? format(metric.current) : metric.current.toLocaleString()}
          trend={toTrend(metric)}
        />
      ))}
    </div>
  );
});
