'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function SafeExitClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.SafeExitClicks]}
      dataSource="events"
      label="Safe Exit Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.SafeExitClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.SafeExitClick] ?? 0,
      })}
    />
  );
}
