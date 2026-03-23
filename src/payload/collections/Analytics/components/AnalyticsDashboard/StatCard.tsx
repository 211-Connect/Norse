'use client';

import React from 'react';

export const StatCard = React.memo(function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: number;
}) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendColor =
    trend !== undefined ? (isPositive ? '#16a34a' : '#dc2626') : undefined;

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '0.5rem',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        width: '100%',
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
      >
        <span
          style={{
            fontSize: '1.00rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--theme-elevation-500)',
          }}
        >
          {label}
        </span>
        {trend !== undefined && trend !== 0.0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: trendColor,
            }}
          >
            {isPositive ? '▲' : '▼'}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--theme-text)',
        }}
      >
        {value}
      </span>
    </div>
  );
});
