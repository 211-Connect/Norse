// v2 results always show the sort dropdown (David 2026-11-18, Lucas 2026-11-19). v1 Hybrid/AI keeps it hidden.
// Order on v2: Most Relevant, Nearest First (coordinates only), Provider Name (service-name tenants), Resource Name.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  showsSort,
  sortOptionValues,
} from '../src/app/(app)/features/search/utils/sort-options';
import { buildV2Url } from '../src/app/(app)/features/search/v2/v2-request';
import { v2CallString } from '../src/app/(app)/features/search/v2/v2-seed';

test('v2 shows the sort dropdown for a hybrid query', () => {
  assert.equal(showsSort({ queryType: 'hybrid', isV2: true }), true);
  assert.equal(showsSort({ queryType: 'keyword', isV2: true }), true);
});

test('v1 hides the sort dropdown for hybrid and keeps it otherwise', () => {
  assert.equal(showsSort({ queryType: 'hybrid', isV2: false }), false);
  assert.equal(showsSort({ queryType: 'keyword', isV2: false }), true);
});

test('v2 sort order: relevance, nearest, provider, resource', () => {
  assert.deepEqual(
    sortOptionValues({
      isV2: true,
      showServiceName: true,
      hasCoordinates: true,
    }),
    ['relevance', 'distance', 'organization', 'name'],
  );
});

test('v2 leaves out Nearest First without coordinates and Provider Name without the flag', () => {
  assert.deepEqual(
    sortOptionValues({
      isV2: true,
      showServiceName: false,
      hasCoordinates: false,
    }),
    ['relevance', 'name'],
  );
});

test('v1 sort order is unchanged', () => {
  assert.deepEqual(
    sortOptionValues({
      isV2: false,
      showServiceName: true,
      hasCoordinates: true,
    }),
    ['relevance', 'name', 'organization', 'distance'],
  );
});

test('the sort reaches the /v2/search call and its cache key', () => {
  const params = new URLSearchParams('query=food&sort=name');
  assert.equal(
    new URL(buildV2Url('http://api', params, 't1')).searchParams.get('sort'),
    'name',
  );
  assert.match(v2CallString(params), /sort=name/);
});
