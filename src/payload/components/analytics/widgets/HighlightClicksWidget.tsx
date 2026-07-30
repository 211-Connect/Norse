'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function HighlightClicksWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.HighlightClicks]}
      dataSource="metrics"
      label="Highlight Clicks"
      selector={(metrics) => ({
        current: metrics.current.highlightClicks ?? 0,
        previous: metrics.previous.highlightClicks ?? 0,
      })}
    />
  );
}
