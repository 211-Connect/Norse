'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function WidgetSearchesWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.WidgetSearches]}
      dataSource="events"
      label="Widget Searches"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.WidgetSearch] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.WidgetSearch] ?? 0,
      })}
    />
  );
}
