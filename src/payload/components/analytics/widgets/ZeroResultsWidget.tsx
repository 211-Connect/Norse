'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ZeroResultsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.ZeroResults]}
      dataSource="events"
      label="Searches with 0 Results"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.SearchZeroResults] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.SearchZeroResults] ?? 0,
      })}
    />
  );
}
