'use client';

import { useAnalyticsBlockedTraffic } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';
import { SingleStatCardWidget } from './SingleStatCardWidget';

/**
 * ISS-2366: requests Arcjet bot protection denied. Reads Norse-API's hourly
 * counters (`/analytics/blocked-traffic`), not Umami: these requests never
 * load the page. Counts only blocked requests, not observe-only detections.
 * The endpoint has no previous-period comparison, so the card shows no trend.
 */
export default function BlockedBotsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.BlockedBots]}
      dataSource="custom"
      label="Blocked Bots"
      useData={useAnalyticsBlockedTraffic}
      selector={(data) => ({
        current: (data as { blocked: number }).blocked,
        previous: 0,
      })}
    />
  );
}
