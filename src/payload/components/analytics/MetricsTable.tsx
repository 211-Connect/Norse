'use client';

import { Table } from '@payloadcms/ui';
import type { Column } from 'payload';
import { memo, type ReactNode, useEffect, useMemo, useState } from 'react';

import type { MetricEntry } from './types';

type Row = MetricEntry;

export const MetricsTable = memo(function MetricsTable({
  title,
  colLabel,
  colValue,
  rows,
  pageSize = 10,
  onPageRowsChange,
  footerStart,
  emptyState,
}: {
  title: string;
  colLabel: string;
  colValue: string;
  rows: Row[];
  pageSize?: number;
  onPageRowsChange?: (rows: Row[]) => void;
  footerStart?: ReactNode;
  emptyState?: ReactNode;
}) {
  if (rows.length === 0 && !emptyState) return null;

  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  useEffect(() => {
    onPageRowsChange?.(pagedRows);
  }, [onPageRowsChange, pagedRows]);

  const columns: Column[] = [
    {
      accessor: 'label',
      active: true,
      field: { name: 'label', type: 'text' },
      Heading: <span>{colLabel}</span>,
      renderedCells: pagedRows.map((r, i) => <span key={i}>{r.x}</span>),
    },
    {
      accessor: 'value',
      active: true,
      field: { name: 'value', type: 'text' },
      Heading: <span>{colValue}</span>,
      renderedCells: pagedRows.map((r, i) => (
        <span key={i}>{r.y.toLocaleString()}</span>
      )),
    },
  ];

  const data: Record<string, unknown>[] = pagedRows.map((r, i) => ({
    id: i,
    label: r.x,
    value: r.y,
  }));

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

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
        <div style={{ flex: 1, overflow: 'auto' }}>
          {rows.length === 0 ? (
            emptyState
          ) : (
            <Table columns={columns} data={data} appearance="condensed" />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 0 }}>
            {footerStart}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
        </div>
      </div>
    </div>
  );
});
