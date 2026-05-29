'use client';

import { Button } from '@payloadcms/ui';
import dayjs from 'dayjs';
import { atom, useAtom } from 'jotai';
import { useState } from 'react';

import { validateDateRange } from './utils';
import WebsitePicker from './WebsitePicker';
import type { DateRange as DateRangeType } from './types';

const DATE_RANGES: (7 | 30 | 90)[] = [7, 30, 90];

export const analyticsDateRangeAtom = atom<DateRangeType>(30);
export const analyticsSelectedWebsiteIdsAtom = atom<string[]>([]);

export default function DateRange() {
  const [range, setRange] = useAtom(analyticsDateRangeAtom);

  // Initialize date inputs with current range
  const getInitialDates = () => {
    if (typeof range === 'number') {
      return {
        start: dayjs().subtract(range, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
      };
    }
    return { start: range.start, end: range.end };
  };

  const [startDate, setStartDate] = useState(getInitialDates().start);
  const [endDate, setEndDate] = useState(getInitialDates().end);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePresetClick = (days: 7 | 30 | 90) => {
    const end = dayjs().format('YYYY-MM-DD');
    const start = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
    setStartDate(start);
    setEndDate(end);
    setErrorMessage(null);
  };

  const handleApply = () => {
    const error = validateDateRange(startDate, endDate);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage(null);
    setRange({ start: startDate, end: endDate });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setErrorMessage(null);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexShrink: 0,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            color: 'var(--theme-error-500, #dc2626)',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </div>

        {DATE_RANGES.map((d) => (
          <Button
            key={d}
            buttonStyle="secondary"
            size="small"
            onClick={() => handlePresetClick(d)}
          >
            Last {d} days
          </Button>
        ))}

        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            max={dayjs().format('YYYY-MM-DD')}
            style={{
              padding: '0.375rem 0.5rem',
              fontSize: '0.875rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--theme-elevation-200)',
              backgroundColor: 'var(--theme-elevation-50)',
              color: 'var(--theme-text)',
              height: '2rem',
            }}
          />
          <span style={{ color: 'var(--theme-text)', fontSize: '0.875rem' }}>
            to
          </span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            max={dayjs().format('YYYY-MM-DD')}
            style={{
              padding: '0.375rem 0.5rem',
              fontSize: '0.875rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--theme-elevation-200)',
              backgroundColor: 'var(--theme-elevation-50)',
              color: 'var(--theme-text)',
              height: '2rem',
            }}
          />
          <Button
            buttonStyle="primary"
            size="small"
            onClick={handleApply}
            disabled={!startDate || !endDate}
          >
            Apply
          </Button>
        </div>
      </div>

      <WebsitePicker />
    </div>
  );
}
