'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function SearchesWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.Searches]}
      dataSource="paths"
      label="Searches"
      selector={(paths) => ({
        current: paths.searchCount,
        previous: paths.prevSearchCount,
      })}
    />
  );
}
