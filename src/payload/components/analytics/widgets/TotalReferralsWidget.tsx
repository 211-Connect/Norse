'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function TotalReferralsWidget() {
  return (
    <SingleStatCardWidget
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
