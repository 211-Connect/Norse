// The pins request: what it carries, so every page of a search is one cache entry.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parsePinsQuery,
  toPinsQuery,
} from '../src/app/(app)/shared/lib/search-params';

const query = {
  query: 'food',
  queryType: 'text',
  coordinates: [-77.43612, 37.54072],
  distance: '10',
  filters: { languages: ['es'] },
  sort: 'distance' as const,
  queryLabel: 'Food',
  location: 'Richmond',
};

test('the pins query leaves out the tenant, sort, label and location', () => {
  const params = parsePinsQuery(toPinsQuery(query, 'en', 'classic'));

  assert.deepEqual(Object.keys(params).sort(), [
    'coords',
    'distance',
    'filters',
    'locale',
    'query',
    'query_type',
  ]);
  assert.equal(params.query, 'food');
  assert.equal(params.locale, 'en');
  assert.deepEqual(params.filters, { languages: ['es'] });
});

test('the pins query rounds coordinates so neighbours share it', () => {
  const near = toPinsQuery(
    { ...query, coordinates: [-77.43912, 37.54272] },
    'en',
    'classic',
  );

  assert.equal(near, toPinsQuery(query, 'en', 'classic'));
});

test('parsing drops params a pins request may not carry', () => {
  const params = parsePinsQuery(
    '?query=food&locale=en&tenant_id=other&page=3&limit=50&sort=distance',
  );

  assert.deepEqual(params, { query: 'food', locale: 'en' });
});
