'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function PageViewsWidget() {
  return (
    <SingleStatCardWidget
      label="Page Views"
      selector={(data) =>
        data.stats
          ? { current: data.stats.pageviews, previous: data.stats.comparison.pageviews }
          : null
      }
    />
  );
}
