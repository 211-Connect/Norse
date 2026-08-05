'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function SmsClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.SmsClicks]}
      dataSource="metrics"
      label="SMS Clicks"
      selector={(metrics) => ({
        current: metrics.current.smsClicks ?? 0,
        previous: metrics.previous.smsClicks ?? 0,
      })}
    />
  );
}
