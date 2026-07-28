import { DefaultDashboard } from '@payloadcms/next/views';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { Fragment } from 'react';

import DateRange from '../analytics/DateRange';
import ExportCSVButton from '../analytics/ExportCSVButton';
import TenantAutoSelect from '../analytics/TenantAutoSelect';
import { ANALYTICS_DEFAULT_LAYOUT } from '../analytics/widgetInfo';

export default function AnalyticsView(props: AdminViewServerProps) {
  const user = props.user ?? (props.initPageResult?.req?.user as any);

  if (!user) {
    return null;
  }

  // Only allow analytics widgets to be added/rendered on this dashboard.
  // Payload's core config sanitizer always injects a built-in `collections`
  // widget into `admin.dashboard.widgets`, so we filter it (and any other
  // non-analytics widget) out here.
  const analyticsWidgets = (
    props.payload.config.admin.dashboard?.widgets ?? []
  ).filter((widget) => widget.slug.startsWith('analytics-'));

  const patchedConfig = {
    ...props.payload.config,
    admin: {
      ...props.payload.config.admin,
      dashboard: {
        ...(props.payload.config.admin.dashboard ?? {}),
        widgets: analyticsWidgets,
        defaultLayout: ANALYTICS_DEFAULT_LAYOUT,
      },
    },
  };

  const patchedProps = {
    ...props,
    payload: { ...props.payload, config: patchedConfig },
  } as any;

  return (
    <Fragment>
      <HydrateAuthProvider permissions={props.initPageResult?.permissions} />
      <SetStepNav nav={[]} />
      <TenantAutoSelect />
      <Gutter>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.5rem',
            paddingBottom: '0.5rem',
          }}
        >
          <h1 style={{ margin: 0 }}>Analytics</h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <ExportCSVButton />
            <DateRange />
          </div>
        </div>
      </Gutter>
      <DefaultDashboard {...patchedProps} user={user} />
    </Fragment>
  );
}
