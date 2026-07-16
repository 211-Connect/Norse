'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function DirectionsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.Directions]}
      dataSource="events"
      label="Directions Clicks"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.DirectionClick] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.DirectionClick] ?? 0,
      })}
    />
  );
}
