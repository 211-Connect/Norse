import React, { Fragment } from 'react';
import { DefaultDashboard } from '@payloadcms/next/views';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import DateRange from '../analytics/DateRange';

export default function MainDashboardView(props: AdminViewServerProps) {
  const user = props.user ?? (props.initPageResult?.req?.user as any);

  return (
    <Fragment>
      <HydrateAuthProvider permissions={props.initPageResult?.permissions} />
      <SetStepNav nav={[]} />
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
      <DefaultDashboard {...(props as any)} user={user} />
    </Fragment>
  );
}
