'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function WidgetSearchesWidget() {
  return (
    <SingleStatCardWidget
      label="Widget Searches"
      selector={(data) => data.metrics.widgetSearches}
    />
  );
}
