'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function SearchesWidget() {
  return (
    <SingleStatCardWidget
      label="Searches"
      selector={(data) => data.metrics.searches}
    />
  );
}
