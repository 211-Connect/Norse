'use client';

import React from 'react';
import { atom, useAtom } from 'jotai';
import { Button } from '@payloadcms/ui';
import type { DateRange } from './types';

const DATE_RANGES: DateRange[] = [7, 30, 90];

export const analyticsDateRangeAtom = atom<DateRange>(30);

export default function DateRange() {
  const [range, setRange] = useAtom(analyticsDateRangeAtom);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
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
  );
}
