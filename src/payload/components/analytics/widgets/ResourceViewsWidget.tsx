'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ResourceViewsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.ResourceViews]}
      dataSource="metrics"
      label="Resource Views"
      selector={(metrics) => ({
        current: metrics.current.resourceViews ?? 0,
        previous: metrics.previous.resourceViews ?? 0,
      })}
    />
  );
}
