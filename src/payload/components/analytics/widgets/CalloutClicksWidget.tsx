'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function CalloutClicksWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Callout Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.CalloutClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.CalloutClick] ?? 0,
      })}
    />
  );
}
