'use client';

import React from 'react';
import { MetricsTable } from './MetricsTable';
import type { MetricEntry } from './types';

export const LowerContainer = React.memo(function LowerContainer({
  resourceRows,
  searchByLabel,
}: {
  resourceRows: MetricEntry[];
  searchByLabel: MetricEntry[];
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <MetricsTable
          title="Resource Titles"
          colLabel="Path"
          colValue="Referrals"
          rows={resourceRows}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <MetricsTable
          title="Searches by Query Label"
          colLabel="Query Label"
          colValue="Searches"
          rows={searchByLabel}
        />
      </div>
    </div>
  );
});
