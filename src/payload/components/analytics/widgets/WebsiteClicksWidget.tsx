'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function WebsiteClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.WebsiteClicks]}
      dataSource="metrics"
      label="Website Clicks"
      selector={(metrics) => ({
        current: metrics.current.websiteClicks ?? 0,
        previous: metrics.previous.websiteClicks ?? 0,
      })}
    />
  );
}
