'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function AlertClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.AlertClicks]}
      dataSource="metrics"
      label="Alert Clicks"
      selector={(metrics) => ({
        current: metrics.current.alertClicks ?? 0,
        previous: metrics.previous.alertClicks ?? 0,
      })}
    />
  );
}
