import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter, HydrateAuthProvider, SetStepNav } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { Fragment } from 'react';

import ScorecardsManager from '@/payload/components/scorecards/ScorecardsManager';

export default function ScorecardsView(props: AdminViewServerProps) {
  const user = props.user ?? props.initPageResult?.req?.user;

  if (!user) {
    return null;
  }

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
              paddingBottom: '1rem',
            }}
          >
            <h1 style={{ margin: 0 }}>Scorecards</h1>
          </div>
          <ScorecardsManager />
        </Gutter>
      </DefaultTemplate>
    </Fragment>
  );
}
