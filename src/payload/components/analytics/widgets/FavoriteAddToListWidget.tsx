'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function FavoriteAddToListWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.FavoriteAddToList]}
      dataSource="metrics"
      label="Adds to Favorites List"
      selector={(metrics) => ({
        current: metrics.current.favoriteAddToList ?? 0,
        previous: metrics.previous.favoriteAddToList ?? 0,
      })}
    />
  );
}
