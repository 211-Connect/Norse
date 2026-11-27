// The sort a search reports when the URL states none. It is both what Norse-API is asked for and what the
// "Sort by" control shows, so it must name the order the API actually returns.
//
// A located text or taxonomy search is nearest first (MBOA QA checklist, "Monarch Healthcare Management" and
// Respite Care from 540 Cedar Street, Saint Paul). Hybrid stays relevance: its query has no relevance gate, so
// nearest first would list every resource in the radius, and its sort control is hidden (9a35c7cf, SCC211).
// A search whose type the URL does not state may be hybrid on the tenant's engine, so it stays relevance too.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liftQueryString,
  toFindResourcesQuery,
} from '../src/app/(app)/features/search/intent';

const SAINT_PAUL =
  'location=540+Cedar+Street%2C+Saint+Paul%2C+Minnesota+55155%2C+United+States&coords=-93.096881%2C44.950758&distance=0';

const sortFor = (query: string) =>
  toFindResourcesQuery(liftQueryString(query).intent).sort;

test('a located taxonomy search with no stated sort is nearest first', () => {
  assert.equal(
    sortFor(
      `query=PH-7000&query_label=Respite+Care&query_type=taxonomy&${SAINT_PAUL}`,
    ),
    'distance',
  );
  assert.equal(
    sortFor(
      'query=BT-4500.4500-710%2C%20BT-4500.4700%2C%20BT-4500.6500-170%2C%20BT-4500.6500-500%2C%20BT-4500.6500-800%2C%20BT-8300.1000%2C%20BT-8500.1000-180' +
        `&query_label=I%20need%20transportation.&query_type=taxonomy&${SAINT_PAUL}`,
    ),
    'distance',
  );
});

test('taxonomy codes sent without query_type are still a taxonomy search', () => {
  assert.equal(sortFor(`query=PH-7000&${SAINT_PAUL}`), 'distance');
});

test('a taxonomy search without a location stays relevance', () => {
  assert.equal(
    sortFor('query=PH-7000&query_label=Respite+Care&query_type=taxonomy'),
    'relevance',
  );
});

test('a located text search with no stated sort is nearest first', () => {
  assert.equal(
    sortFor(
      `query=Monarch+Healthcare+management&query_label=Monarch+Healthcare+management&query_type=text&${SAINT_PAUL}`,
    ),
    'distance',
  );
});

test('a text search without a location stays relevance', () => {
  assert.equal(
    sortFor('query=Monarch+Healthcare+management&query_type=text'),
    'relevance',
  );
});

test('a located hybrid search stays relevance (SCC211)', () => {
  assert.equal(
    sortFor(`query=food&query_type=hybrid&${SAINT_PAUL}`),
    'relevance',
  );
});

test('a located search without a query type stays relevance', () => {
  assert.equal(sortFor(`query=food&${SAINT_PAUL}`), 'relevance');
});

test('a stated distance without valid coords is relevance', () => {
  assert.equal(
    sortFor('query=food&query_type=text&sort=distance'),
    'relevance',
  );
});

test('a stated sort always wins', () => {
  for (const sort of ['relevance', 'name', 'organization'] as const) {
    assert.equal(
      sortFor(`query=PH-7000&query_type=taxonomy&sort=${sort}&${SAINT_PAUL}`),
      sort,
    );
    assert.equal(
      sortFor(`query=food&query_type=text&sort=${sort}&${SAINT_PAUL}`),
      sort,
    );
  }
});
