'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function SafeExitClicksWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Safe Exit Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.SafeExitClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.SafeExitClick] ?? 0,
      })}
    />
  );
}
