'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';

export default function DirectionsWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Directions Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.DirectionClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.DirectionClick] ?? 0,
      })}
    />
  );
}
