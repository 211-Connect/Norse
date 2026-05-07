import React from 'react';
import { DefaultDashboard } from '@payloadcms/next/views';
import type { AdminViewServerProps } from 'payload';

export default function MainDashboardView(props: AdminViewServerProps) {
  return <DefaultDashboard {...(props as any)} />;
}
