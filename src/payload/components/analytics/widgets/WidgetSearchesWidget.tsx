'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function WidgetSearchesWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.WidgetSearches]}
      dataSource="metrics"
      label="Widget Searches"
      selector={(metrics) => ({
        current: metrics.current.widgetSearches ?? 0,
        previous: metrics.previous.widgetSearches ?? 0,
      })}
    />
  );
}
