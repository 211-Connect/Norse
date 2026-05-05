'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function DirectionsWidget() {
  return (
    <SingleStatCardWidget
      label="Directions Clicks"
      selector={(data) => data.metrics.directions}
    />
  );
}
