'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function WebsiteClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.WebsiteClicks]}
      dataSource="events"
      label="Website Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.WebsiteClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.WebsiteClick] ?? 0,
      })}
    />
  );
}
