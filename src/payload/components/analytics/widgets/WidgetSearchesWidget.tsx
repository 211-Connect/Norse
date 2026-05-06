'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';

export default function WidgetSearchesWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Widget Searches"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.WidgetSearch] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.WidgetSearch] ?? 0,
      })}
    />
  );
}
