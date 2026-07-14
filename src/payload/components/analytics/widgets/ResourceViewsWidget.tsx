'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function ResourceViewsWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.ResourceViews]}
      dataSource="paths"
      label="Resource Views"
      selector={(paths) => ({
        current: paths.resourceMetrics.reduce((s, m) => s + m.y, 0),
        previous: paths.prevResourceMetrics.reduce((s, m) => s + m.y, 0),
      })}
    />
  );
}
