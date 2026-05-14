'use client';

import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function TotalUsersWidget() {
  return (
    <SingleStatCardWidget
      dataSource="stats"
      label="Total Users"
      selector={(stats) => ({
        current: stats.visitors,
        previous: stats.comparison.visitors,
      })}
    />
  );
}
