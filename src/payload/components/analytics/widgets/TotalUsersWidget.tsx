'use client';
import React from 'react';
import { SingleStatCardWidget } from './SingleStatCardWidget';

export default function TotalUsersWidget() {
  return (
    <SingleStatCardWidget
      label="Total Users"
      selector={(data) =>
        data.stats
          ? { current: data.stats.visitors, previous: data.stats.comparison.visitors }
          : null
      }
    />
  );
}
