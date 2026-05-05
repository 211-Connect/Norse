'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function ResourceViewsWidget() {
  return (
    <SingleStatCardWidget
      label="Resource Views"
      selector={(data) => data.metrics.resourceViews}
    />
  );
}
