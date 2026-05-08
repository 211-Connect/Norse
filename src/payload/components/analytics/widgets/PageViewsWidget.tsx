'use client';
import React from 'react';

import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function PageViewsWidget() {
  return (
    <SingleStatCardWidget
      dataSource="stats"
      label="Page Views"
      selector={(stats) => ({
        current: stats.pageviews,
        previous: stats.comparison.pageviews,
      })}
    />
  );
}
