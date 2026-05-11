'use client';

import { Button } from '@payloadcms/ui';
import { atom, useAtom } from 'jotai';

import type { DateRange as DateRangeType } from './types';

const DATE_RANGES: DateRangeType[] = [7, 30, 90];

export const analyticsDateRangeAtom = atom<DateRangeType>(30);

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
