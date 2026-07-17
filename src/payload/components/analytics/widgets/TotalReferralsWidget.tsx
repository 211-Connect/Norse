'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function TotalReferralsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.TotalReferrals]}
      dataSource="metrics"
      label="Total Referrals"
      selector={(metrics) => ({
        current:
          (metrics.current.directions ?? 0) +
          (metrics.current.phoneCalls ?? 0) +
          (metrics.current.websiteClicks ?? 0),
        previous:
          (metrics.previous.directions ?? 0) +
          (metrics.previous.phoneCalls ?? 0) +
          (metrics.previous.websiteClicks ?? 0),
      })}
    />
  );
}
