'use client';

import { UmamiEvent } from '../../../../app/(app)/shared/lib/umami';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function FavoriteAddToListWidget() {
  return (
    <SingleStatCardWidget
      dataSource="events"
      label="Adds to Favorites List"
      selector={(events) => ({
        current: events.eventTotals[UmamiEvent.FavoriteAddToList] ?? 0,
        previous: events.prevEventTotals[UmamiEvent.FavoriteAddToList] ?? 0,
      })}
    />
  );
}
