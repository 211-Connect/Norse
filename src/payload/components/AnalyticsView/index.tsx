import { DefaultTemplate } from '@payloadcms/next/templates';
import { DefaultDashboard } from '@payloadcms/next/views';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { Fragment } from 'react';

import DateRange from '../analytics/DateRange';
import ExportCSVButton from '../analytics/ExportCSVButton';
import TenantAutoSelect from '../analytics/TenantAutoSelect';
import { WidgetSlug } from '../analytics/widgetInfo';

const ANALYTICS_DEFAULT_LAYOUT = [
  { widgetSlug: WidgetSlug.TotalUsers, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.Searches, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.ResourceViews, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.ZeroResults, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.WebsiteClicks, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PhoneCalls, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.Directions, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.TotalReferrals, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PageViews, width: 'x-small' as const },
  { widgetSlug: WidgetSlug.PageviewsChart, width: 'medium' as const },
  { widgetSlug: WidgetSlug.Map, width: 'medium' as const },
  { widgetSlug: WidgetSlug.ResourceTitles, width: 'medium' as const },
  { widgetSlug: WidgetSlug.SearchQueries, width: 'medium' as const },
];

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
      <DefaultTemplate
        i18n={props.i18n}
        locale={props.initPageResult?.locale}
        params={props.params}
        payload={props.payload}
        permissions={props.initPageResult?.permissions}
        req={props.initPageResult?.req}
        searchParams={props.searchParams}
        user={props.user}
        visibleEntities={{
          collections: props.initPageResult?.visibleEntities?.collections,
          globals: props.initPageResult?.visibleEntities?.globals,
        }}
      >
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
      </DefaultTemplate>
    </Fragment>
  );
}
