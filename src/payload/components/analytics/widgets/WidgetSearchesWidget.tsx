'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

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
