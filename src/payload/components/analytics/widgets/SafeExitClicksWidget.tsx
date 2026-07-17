'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function SafeExitClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.SafeExitClicks]}
      dataSource="metrics"
      label="Safe Exit Clicks"
      selector={(metrics) => ({
        current: metrics.current.safeExitClicks ?? 0,
        previous: metrics.previous.safeExitClicks ?? 0,
      })}
    />
  );
}
