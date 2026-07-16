'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function TotalReferralsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.TotalReferrals]}
      dataSource="events"
      label="Total Referrals"
      selector={(events) => ({
        current:
          (events.eventTotals[UmamiEvent.DirectionClick] ?? 0) +
          (events.eventTotals[UmamiEvent.PhoneClick] ?? 0) +
          (events.eventTotals[UmamiEvent.WebsiteClick] ?? 0),
        previous:
          (events.prevEventTotals[UmamiEvent.DirectionClick] ?? 0) +
          (events.prevEventTotals[UmamiEvent.PhoneClick] ?? 0) +
          (events.prevEventTotals[UmamiEvent.WebsiteClick] ?? 0),
      })}
    />
  );
}
