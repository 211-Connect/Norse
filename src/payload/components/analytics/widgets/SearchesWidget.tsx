'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function SearchesWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.Searches]}
      dataSource="metrics"
      label="Searches"
      selector={(metrics) => ({
        current: metrics.current.searches ?? 0,
        previous: metrics.previous.searches ?? 0,
      })}
    />
  );
}
