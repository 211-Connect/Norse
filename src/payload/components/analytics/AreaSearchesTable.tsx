'use client';

import { Table } from '@payloadcms/ui';
import type { Column } from 'payload';
import { memo, useEffect, useMemo, useState } from 'react';

import type { AreaMetricsRow } from './types';

type SortKey = 'area' | 'totalSearches' | 'zeroSearches' | 'zeroRate';
type SortDirection = 'asc' | 'desc';

export const AreaSearchesTable = memo(function AreaSearchesTable({
  title,
  areaLabel,
  rows,
  emptyMessage,
  pageSize = 10,
}: {
  title: string;
  areaLabel: string;
  rows: AreaMetricsRow[];
  emptyMessage: string;
  pageSize?: number;
}) {
  if (rows.length === 0) {
    return (
      <Container title={title}>
        <EmptyState message={emptyMessage} />
      </Container>
    );
  }

  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('zeroRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedRows = useMemo(() => {
    const next = [...rows];

    next.sort((a, b) => {
      const compare =
        sortKey === 'area'
          ? a.area.localeCompare(b.area)
          : a[sortKey] - b[sortKey];

      return sortDirection === 'asc' ? compare : -compare;
    });

    return next;
  }, [rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const toggleSort = (nextKey: SortKey) => {
    setSortDirection((currentDirection) => {
      if (sortKey !== nextKey) {
        setSortKey(nextKey);
        return nextKey === 'area' ? 'asc' : 'desc';
      }

      return currentDirection === 'asc' ? 'desc' : 'asc';
    });
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [rows, sortKey, sortDirection]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [page, pageSize, sortedRows]);

  const sortIndicator = (key: SortKey): string => {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const columns: Column[] = [
    {
      accessor: 'area',
      active: true,
      field: { name: 'area', type: 'text' },
      Heading: (
        <button type="button" onClick={() => toggleSort('area')}>
          {areaLabel} {sortIndicator('area')}
        </button>
      ),
      renderedCells: pagedRows.map((row, index) => (
        <span key={index}>{row.area}</span>
      )),
    },
    {
      accessor: 'totalSearches',
      active: true,
      field: { name: 'totalSearches', type: 'text' },
      Heading: (
        <button type="button" onClick={() => toggleSort('totalSearches')}>
          Total searches {sortIndicator('totalSearches')}
        </button>
      ),
      renderedCells: pagedRows.map((row, index) => (
        <span key={index}>{row.totalSearches.toLocaleString()}</span>
      )),
    },
    {
      accessor: 'zeroSearches',
      active: true,
      field: { name: 'zeroSearches', type: 'text' },
      Heading: (
        <button type="button" onClick={() => toggleSort('zeroSearches')}>
          Zero searches {sortIndicator('zeroSearches')}
        </button>
      ),
      renderedCells: pagedRows.map((row, index) => (
        <span key={index}>{row.zeroSearches.toLocaleString()}</span>
      )),
    },
    {
      accessor: 'zeroRate',
      active: true,
      field: { name: 'zeroRate', type: 'text' },
      Heading: (
        <button type="button" onClick={() => toggleSort('zeroRate')}>
          % zero {sortIndicator('zeroRate')}
        </button>
      ),
      renderedCells: pagedRows.map((row, index) => (
        <span key={index}>{formatPercent(row.zeroRate)}</span>
      )),
    },
  ];

  const data: Record<string, unknown>[] = pagedRows.map((row, index) => ({
    id: index,
    area: row.area,
    totalSearches: row.totalSearches,
    zeroSearches: row.zeroSearches,
    zeroRate: row.zeroRate,
  }));

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <Container title={title}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table columns={columns} data={data} appearance="condensed" />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={!canGoPrev}
          style={{
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.625rem',
            fontSize: '0.875rem',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            opacity: canGoPrev ? 1 : 0.5,
            background: 'var(--theme-elevation-0)',
          }}
        >
          Previous
        </button>
        <span
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '0.875rem',
          }}
        >
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={!canGoNext}
          style={{
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.625rem',
            fontSize: '0.875rem',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            opacity: canGoNext ? 1 : 0.5,
            background: 'var(--theme-elevation-0)',
          }}
        >
          Next
        </button>
      </div>
    </Container>
  );
});

function Container({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '0.5rem',
        padding: '1rem',
        background: 'var(--theme-elevation-0)',
        height: '480px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          height: '100%',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--theme-text)',
          }}
        >
          {title}
        </h4>
        {children}
      </div>
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
