'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function DirectionsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.Directions]}
      dataSource="metrics"
      label="Directions Clicks"
      selector={(metrics) => ({
        current: metrics.current.directions ?? 0,
        previous: metrics.previous.directions ?? 0,
      })}
    />
  );
}
