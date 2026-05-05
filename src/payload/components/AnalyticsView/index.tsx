import React, { Fragment } from 'react';
import { DefaultDashboard } from '@payloadcms/next/views';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import DateRange from '../analytics/DateRange';

// The real payload-config defaultLayout is the analytics layout, so
// "Reset Layout" on this page correctly restores the analytics widgets.
// We only need to bypass user preferences (which are shared with the main
// dashboard) by passing a sentinel user ID — the real defaultLayout is used
// as the fallback automatically.
export default function AnalyticsView(props: AdminViewServerProps) {
  // getItemsFromPreferences uses React cache() keyed on (key, payload, userID, collection).
  // Pass a sentinel userID so no saved main-dashboard preferences are loaded,
  // forcing fallback to the real defaultLayout (the analytics widgets).
  // We preserve the real collection slug so the user.relationTo query stays valid.
  const realUser = props.user ?? (props.initPageResult?.req?.user as any);
  const fakeUser = realUser
    ? { ...realUser, id: '__analytics_no_prefs__' }
    : { id: '__analytics_no_prefs__', collection: 'users' };

  const patchedReq = props.initPageResult?.req
    ? { ...props.initPageResult.req, user: fakeUser }
    : undefined;

  const patchedInitPageResult = props.initPageResult
    ? { ...props.initPageResult, req: patchedReq }
    : undefined;

  const dashboardProps = {
    ...props,
    user: fakeUser,
    initPageResult: patchedInitPageResult,
    locale: props.initPageResult?.locale,
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
        <DefaultDashboard {...dashboardProps} />
      </DefaultTemplate>
    </Fragment>
  );
}
