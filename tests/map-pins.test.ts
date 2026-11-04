// A map's pins: what shares a circle, what is a pin instead, and the list cap they share.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getCoreExtent } from '../src/app/(app)/shared/components/map/map-shared';
import {
  MAP_PINS_LIMIT,
  SearchPin,
  groupPinsBySite,
  lastPageWithinPinLimit,
  omitPagePins,
  roundCoordinatesForPins,
} from '../src/app/(app)/features/search/utils/map-pins';

const pin = (id: string, coordinates?: [number, number]): SearchPin => ({
  id,
  resourceId: id,
  name: id,
  address: '',
  coordinates,
});

test('resources at one address share a site; unlocated pins stay apart', () => {
  const sites = groupPinsBySite([
    pin('a', [-77.43, 37.54]),
    pin('b', [-77.43, 37.54]),
    pin('c', [-77.5, 37.6]),
    pin('d'),
    pin('e'),
  ]);

  assert.deepEqual(
    sites.map((site) => site.map(({ id }) => id)),
    [['a', 'b'], ['c'], ['d'], ['e']],
  );
});

test('a result on the current page is a pin, so it gets no circle', () => {
  const circles = omitPagePins(
    [pin('a', [1, 1]), pin('b', [2, 2])],
    [pin('a', [1, 1])],
  );

  assert.deepEqual(
    circles.map(({ id }) => id),
    ['b'],
  );
});

test('coordinates round to two decimals, so neighbours share a cache entry', () => {
  assert.deepEqual(
    roundCoordinatesForPins([-77.4361, 37.5407]),
    [-77.44, 37.54],
  );
  assert.equal(roundCoordinatesForPins(undefined), undefined);
});

test('the last list page still holds the last result within the limit', () => {
  assert.equal(lastPageWithinPinLimit(25), MAP_PINS_LIMIT / 25);
  assert.equal(lastPageWithinPinLimit(30), 34);
});

test('a few distant locations do not stretch the frame', () => {
  const nearby = Array.from({ length: 98 }, (_, index): [number, number] => [
    -120 - index / 100,
    47 + index / 100,
  ]);

  assert.deepEqual(getCoreExtent([[-70, 25], ...nearby, [-150, 60]]), [
    [-120.96, 47.01],
    [-120.01, 47.96],
  ]);
});

test('a small result set keeps every location in the frame', () => {
  assert.deepEqual(
    getCoreExtent([
      [-70, 25],
      [-120, 47],
    ]),
    [
      [-120, 25],
      [-70, 47],
    ],
  );
});

test('no locations have no extent to fit', () => {
  assert.equal(getCoreExtent([]), null);
});
