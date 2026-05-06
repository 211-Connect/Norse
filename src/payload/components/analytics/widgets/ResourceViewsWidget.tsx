'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function ResourceViewsWidget() {
  return (
    <SingleStatCardWidget
      dataSource="paths"
      label="Resource Views"
      selector={(paths) => ({
        current: paths.resourceMetrics.reduce((s, m) => s + m.y, 0),
        previous: paths.prevResourceMetrics.reduce((s, m) => s + m.y, 0),
      })}
    />
  );
}
