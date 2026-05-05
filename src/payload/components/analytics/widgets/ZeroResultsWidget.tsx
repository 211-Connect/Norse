'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function ZeroResultsWidget() {
  return (
    <SingleStatCardWidget
      label="Searches with 0 Results"
      selector={(data) => data.metrics.zeroResults}
    />
  );
}
