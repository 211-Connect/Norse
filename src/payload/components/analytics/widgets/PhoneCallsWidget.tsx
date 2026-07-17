'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PhoneCallsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.PhoneCalls]}
      dataSource="metrics"
      label="Phone Calls Clicks"
      selector={(metrics) => ({
        current: metrics.current.phoneCalls ?? 0,
        previous: metrics.previous.phoneCalls ?? 0,
      })}
    />
  );
}
