'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ZeroResultsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.ZeroResults]}
      dataSource="metrics"
      label="Searches with 0 Results"
      selector={(metrics) => ({
        current: metrics.current.zeroResults ?? 0,
        previous: metrics.previous.zeroResults ?? 0,
      })}
    />
  );
}
