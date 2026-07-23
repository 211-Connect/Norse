'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function CalloutClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.CalloutClicks]}
      dataSource="metrics"
      label="Callout Clicks"
      selector={(metrics) => ({
        current: metrics.current.calloutClicks ?? 0,
        previous: metrics.previous.calloutClicks ?? 0,
      })}
    />
  );
}
