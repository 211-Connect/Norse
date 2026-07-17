'use client';

import { useState } from 'react';

import type { SearchHits } from '../../../../lib/api/generated/data-contracts';
import { MetricsTable } from '../MetricsTable';
import type { MetricEntry, SearchQueryType } from '../types';
import { useAnalyticsSearches } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

type Filter = 'all' | SearchQueryType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'text', label: 'Text' },
  { value: 'taxonomy', label: 'Taxonomy' },
  { value: 'hybrid', label: 'Hybrid' },
];

function toEntries(hits: SearchHits[]): MetricEntry[] {
  return hits.map((h) => ({ x: h.query, y: h.hits }));
}

export default function SearchQueriesWidget() {
  const { loading, error, data, refetch } = useAnalyticsSearches();
  const [filter, setFilter] = useState<Filter>('all');

  const byType = data;
  const rows: MetricEntry[] =
    filter === 'all'
      ? [
          ...toEntries(byType?.text ?? []),
          ...toEntries(byType?.taxonomy ?? []),
          ...toEntries(byType?.hybrid ?? []),
        ].sort((a, b) => b.y - a.y)
      : toEntries(byType?.[filter] ?? []);

  const activeFilterLabel =
    FILTERS.find((f) => f.value === filter)?.label ?? 'All';
  const title =
    filter === 'all'
      ? 'Top search queries'
      : `Top search queries — ${activeFilterLabel}`;

  const emptyMessage =
    filter === 'all'
      ? 'No search queries in this period.'
      : `No ${activeFilterLabel.toLowerCase()} searches in this period.`;

  return (
    <MetricsTable
      title={title}
      colLabel="Query"
      colValue="Count"
      rows={rows}
      footerStart={<FilterPills value={filter} onChange={setFilter} />}
      emptyState={<EmptyState message={emptyMessage} />}
      description={WIDGET_INFO[WidgetSlug.SearchQueries]}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading && !data}
      errorTitle={error ? 'Could not load search queries.' : undefined}
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}

function FilterPills({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (next: Filter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter search queries by type"
      style={{
        display: 'inline-flex',
        gap: '0.25rem',
        padding: '0.125rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '0.5rem',
        background: 'var(--theme-elevation-0)',
      }}
    >
      {FILTERS.map((f) => {
        const active = f.value === value;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.value)}
            style={{
              border: '1px solid transparent',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.625rem',
              fontSize: '0.875rem',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              background: active ? 'var(--theme-elevation-100)' : 'transparent',
              color: active
                ? 'var(--theme-text)'
                : 'var(--theme-elevation-500)',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--theme-elevation-500)',
        fontSize: '0.875rem',
        textAlign: 'center',
        padding: '1rem',
      }}
    >
      {message}
    </div>
  );
}
