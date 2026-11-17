// Printable directories with an area default location (docs/area-search.md#printable-directories).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLocationConflict } from '../src/app/(app)/features/printable-directories/utils/getLocationConflict';
import { matchesDefaultLocation } from '../src/app/(app)/features/printable-directories/utils/matchesDefaultLocation';
import { withDefaultQueryParams } from '../src/app/(app)/features/printable-directories/utils/withDefaultQueryParams';
import { toQuerySourceParams } from '../src/app/(app)/shared/utils/printableDirectoryQueryParams';

const king = {
  locationName: 'King County, Washington',
  coords: { latitude: 47.49, longitude: -121.84 },
  radius: 25,
  regionId: 'county:53033',
  areaMatch: 'serving' as const,
};

test('a source with no location takes the area and its match, with no radius', () => {
  assert.deepEqual(withDefaultQueryParams({ query: 'food' }, king), {
    query: 'food',
    region: 'county:53033',
    area_match: 'serving',
    coords: '-121.84,47.49',
    location: 'King County, Washington',
  });
});

test('a source with its own point keeps it and gets the radius, not the area', () => {
  const merged = withDefaultQueryParams(
    { coords: '-122.3,47.6', location: 'Seattle' },
    king,
  );
  assert.equal(merged.region, undefined);
  assert.equal(merged.distance, 25);
});

test('a point default still adds its radius', () => {
  const { regionId: _r, areaMatch: _a, ...point } = king;
  assert.equal(withDefaultQueryParams({}, point).distance, 25);
});

test('areas conflict by Region id, not by coords', () => {
  assert.equal(
    getLocationConflict(king, { region: 'county:53033', coords: '0,0' }),
    false,
  );
  assert.equal(
    getLocationConflict(king, {
      region: 'county:53061',
      coords: '-121.84,47.49',
    }),
    true,
  );
  assert.equal(matchesDefaultLocation(king, { region: 'county:53033' }), true);
  assert.equal(matchesDefaultLocation(king, { region: 'county:53061' }), false);
});

test('a saved area source keeps region and coords and drops distance', () => {
  assert.deepEqual(
    toQuerySourceParams({
      query: 'food',
      coords: '-121.84,47.49',
      location: 'King County',
      region: 'county:53033',
      distance: 25,
    }),
    {
      query: 'food',
      coords: '-121.84,47.49',
      location: 'King County',
      region: 'county:53033',
    },
  );
  assert.equal(
    toQuerySourceParams({ coords: '1,2', region: 'nope', distance: 5 })
      .distance,
    5,
  );
});
