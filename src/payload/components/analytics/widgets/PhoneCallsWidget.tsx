'use client';
import React from 'react';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function PhoneCallsWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Phone Calls Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.PhoneClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.PhoneClick] ?? 0,
      })}
    />
  );
}
