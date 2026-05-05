'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function WebsiteClicksWidget() {
  return (
    <SingleStatCardWidget
      label="Website Clicks"
      selector={(data) => data.metrics.websiteClicks}
    />
  );
}
