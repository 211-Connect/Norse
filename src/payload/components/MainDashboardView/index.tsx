import React from 'react';
import { DefaultDashboard } from '@payloadcms/next/views';
import type { AdminViewServerProps } from 'payload';

const MAIN_DEFAULT_LAYOUT = [
  { widgetSlug: 'collections', width: 'full' as const },
];

// Overrides the main /admin dashboard defaultLayout to show only the
// collections widget. The real payload-config defaultLayout is set to
// the analytics layout so that "Reset Layout" on the analytics page works.
export default function MainDashboardView(props: AdminViewServerProps) {
  const patchedConfig = {
    ...props.payload.config,
    admin: {
      ...props.payload.config.admin,
      dashboard: {
        ...(props.payload.config.admin.dashboard ?? {}),
        defaultLayout: MAIN_DEFAULT_LAYOUT,
      },
    },
  };

  const dashboardProps = {
    ...props,
    payload: { ...props.payload, config: patchedConfig },
  } as any;

  return <DefaultDashboard {...dashboardProps} />;
}
