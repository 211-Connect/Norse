import React, { Fragment } from 'react';
import { DefaultDashboard } from '@payloadcms/next/views';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import DateRange from '../analytics/DateRange';

const ANALYTICS_DEFAULT_LAYOUT = [
  { widgetSlug: 'analytics-total-users', width: 'x-small' as const },
  { widgetSlug: 'analytics-searches', width: 'x-small' as const },
  { widgetSlug: 'analytics-resource-views', width: 'x-small' as const },
  { widgetSlug: 'analytics-zero-results', width: 'x-small' as const },
  { widgetSlug: 'analytics-website-clicks', width: 'x-small' as const },
  { widgetSlug: 'analytics-phone-calls', width: 'x-small' as const },
  { widgetSlug: 'analytics-directions', width: 'x-small' as const },
  { widgetSlug: 'analytics-page-views', width: 'x-small' as const },
  { widgetSlug: 'analytics-pageviews-chart', width: 'medium' as const },
  { widgetSlug: 'analytics-map', width: 'medium' as const },
  { widgetSlug: 'analytics-resource-titles', width: 'medium' as const },
  { widgetSlug: 'analytics-search-queries', width: 'medium' as const },
];

export default function AnalyticsView(props: AdminViewServerProps) {
  const user = props.user ?? (props.initPageResult?.req?.user as any);

  const patchedConfig = {
    ...props.payload.config,
    admin: {
      ...props.payload.config.admin,
      dashboard: {
        ...(props.payload.config.admin.dashboard ?? {}),
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
            <DateRange />
          </div>
        </Gutter>
        <DefaultDashboard {...patchedProps} user={user} />
      </DefaultTemplate>
    </Fragment>
  );
}
