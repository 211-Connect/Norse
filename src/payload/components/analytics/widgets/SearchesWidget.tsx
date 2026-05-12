'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function SearchesWidget() {
  return (
    <SingleStatCardWidget
      dataSource="paths"
      label="Searches"
      selector={(paths) => ({
        current: paths.searchCount,
        previous: paths.prevSearchCount,
      })}
    />
  );
}
