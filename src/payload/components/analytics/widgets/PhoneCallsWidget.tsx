'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function PhoneCallsWidget() {
  return (
    <SingleStatCardWidget
      label="Phone Calls Clicks"
      selector={(data) => data.metrics.phoneCalls}
    />
  );
}
