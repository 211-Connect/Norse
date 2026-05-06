'use client';

import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';

export default function WebsiteClicksWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Website Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.WebsiteClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.WebsiteClick] ?? 0,
      })}
    />
  );
}
