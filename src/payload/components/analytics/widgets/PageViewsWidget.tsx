'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function PageViewsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.PageViews]}
      dataSource="stats"
      label="Page Views"
      selector={(stats) => ({
        current: stats.pageviews,
        previous: (stats.comparison as { pageviews: number }).pageviews ?? 0,
      })}
    />
  );
}
