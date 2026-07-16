'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PhoneCallsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.PhoneCalls]}
      dataSource="events"
      label="Phone Calls Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.PhoneClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.PhoneClick] ?? 0,
      })}
    />
  );
}
