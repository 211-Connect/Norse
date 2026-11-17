// The `region` slot: an area search (docs/area-search.md) in the /search URL.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyWriterRules,
  liftQueryString,
  searchIntent,
  serializeSearch,
} from '../src/app/(app)/features/search/intent';
import { toFindResourcesQuery } from '../src/app/(app)/features/search/intent/legacy';
import { toSearchParams } from '../src/app/(app)/shared/lib/search-params';

const envelope = { passThrough: [] };
const write = (values: Parameters<typeof searchIntent>[0]) => {
  const written = applyWriterRules(searchIntent(values), envelope, {
    searchEngine: 'classic',
  });
  return serializeSearch(written.intent, written.envelope);
};

test('a region is written with its location, without a distance', () => {
  const url = new URLSearchParams(
    write({
      location: 'King County, Washington, United States',
      coords: [-121.83, 47.49],
      region: 'county:53033',
      distance: '25',
    }),
  );
  assert.equal(url.get('region'), 'county:53033');
  assert.equal(url.get('coords'), '-121.83,47.49');
  assert.equal(url.has('distance'), false);
});

test('a region is not written without a location, or when malformed', () => {
  assert.equal(
    new URLSearchParams(write({ region: 'county:53033' })).has('region'),
    false,
  );
  const url = new URLSearchParams(
    write({ location: 'Seattle', region: 'city:seattle', distance: '10' }),
  );
  assert.equal(url.has('region'), false);
  assert.equal(url.get('distance'), '10');
});

test('a region URL lifts back to the same region', () => {
  const lifted = liftQueryString(
    'query=food&location=Seattle&coords=-122.33%2C47.6&region=place%3A5363000',
  );
  assert.deepEqual(lifted.intent.region, {
    stated: true,
    value: 'place:5363000',
  });
  assert.equal(toFindResourcesQuery(lifted.intent).region, 'place:5363000');
});

test('a malformed region reads as no region', () => {
  const lifted = liftQueryString('location=Seattle&region=everywhere');
  assert.equal(toFindResourcesQuery(lifted.intent).region, undefined);
});

test('an area search sends region and the tenant settings, coords only as the sort origin', () => {
  const params = toSearchParams({
    query: {
      location: 'Seattle',
      coordinates: [-122.33, 47.6],
      region: 'place:5363000',
      areaMatch: 'located',
      includeUnlocated: false,
      distance: '25',
    },
    locale: 'en',
    searchEngine: 'classic',
  });
  assert.equal(params.region, 'place:5363000');
  assert.equal(params.area_match, 'located');
  assert.equal(params.include_unlocated, 'false');
  assert.equal(params.coords, '-122.33,47.6');
  assert.equal('distance' in params, false);
});

test('a point search is unchanged', () => {
  const params = toSearchParams({
    query: {
      location: 'Seattle',
      coordinates: [-122.33, 47.6],
      distance: '25',
    },
    locale: 'en',
    searchEngine: 'classic',
  });
  assert.equal(params.distance, '25');
  assert.equal('region' in params, false);
  assert.equal('area_match' in params, false);
});
