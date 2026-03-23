'use client';

import React from 'react';
import type { Column } from 'payload';
import { Table } from '@payloadcms/ui';
import type { MetricEntry } from './types';

type Row = MetricEntry;

export const MetricsTable = React.memo(function MetricsTable({
  colLabel,
  colValue,
  rows,
}: {
  title: string;
  colLabel: string;
  colValue: string;
  rows: Row[];
}) {
  if (rows.length === 0) return null;

  const columns: Column[] = [
    {
      accessor: 'label',
      active: true,
      field: {} as any,
      Heading: <span>{colLabel}</span>,
      renderedCells: rows.map((r, i) => <span key={i}>{r.x}</span>),
    },
    {
      accessor: 'value',
      active: true,
      field: {} as any,
      Heading: <span>{colValue}</span>,
      renderedCells: rows.map((r, i) => (
        <span key={i}>{r.y.toLocaleString()}</span>
      )),
    },
  ];

  const data: Record<string, unknown>[] = rows.map((r, i) => ({
    id: i,
    label: r.x,
    value: r.y,
  }));

  return <Table columns={columns} data={data} appearance="condensed" />;
});
