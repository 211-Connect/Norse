'use client';

import React from 'react';
import { Card } from '@payloadcms/ui';

export const StatCard = React.memo(function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return <Card title={label} actions={<strong>{value}</strong>} />;
});
