'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';

export default function ZeroResultsWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Searches with 0 Results"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.SearchZeroResults] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.SearchZeroResults] ?? 0,
      })}
    />
  );
}
