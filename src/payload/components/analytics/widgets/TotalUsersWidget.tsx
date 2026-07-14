'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function TotalUsersWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.TotalUsers]}
      dataSource="stats"
      label="Total Users"
      selector={(stats) => ({
        current: stats.visitors,
        previous: stats.comparison.visitors,
      })}
    />
  );
}
