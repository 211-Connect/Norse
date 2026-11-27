import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  type CatalogRegion,
  buildRegionTree,
  newPlaces,
  selectedIds,
  stateEntry,
  withStateSelection,
  withoutState,
} from '../src/app/(app)/features/landing-pages/lib/regionSelection';

const PIERCE: CatalogRegion = {
  id: 'county:53053',
  type: 'county',
  name: 'Pierce County, WA',
  state: 'WA',
};
const KING: CatalogRegion = {
  id: 'county:53033',
  type: 'county',
  name: 'King County, WA',
  state: 'WA',
};
const TACOMA: CatalogRegion = {
  id: 'place:5370000',
  type: 'place',
  name: 'Tacoma',
  state: 'WA',
  county_id: PIERCE.id,
};
const FIFE: CatalogRegion = {
  id: 'place:5324215',
  type: 'place',
  name: 'Fife',
  state: 'WA',
  county_id: PIERCE.id,
};
const SEATTLE: CatalogRegion = {
  id: 'place:5363000',
  type: 'place',
  name: 'Seattle',
  state: 'WA',
  county_id: KING.id,
};
const LOOSE: CatalogRegion = {
  id: 'place:5399999',
  type: 'place',
  name: 'Nowhere',
  state: 'WA',
  county_id: null,
};
const ITEMS = [TACOMA, PIERCE, SEATTLE, KING, FIFE, LOOSE];

describe('buildRegionTree', () => {
  test('counties by name with their cities by name; places without a county apart', () => {
    const tree = buildRegionTree(ITEMS);
    assert.deepEqual(
      tree.counties.map((n) => [n.county.name, n.cities.map((c) => c.name)]),
      [
        ['King County, WA', ['Seattle']],
        ['Pierce County, WA', ['Fife', 'Tacoma']],
      ],
    );
    assert.deepEqual(
      tree.otherCities.map((c) => c.name),
      ['Nowhere'],
    );
  });
});

describe('selection', () => {
  test('stores explicit regions with county ids, and the state with what it saw', () => {
    const selection = withStateSelection(
      [stateEntry('WA')],
      'WA',
      new Set([PIERCE.id, TACOMA.id]),
      ITEMS,
    );
    assert.deepEqual(
      selection.map((r) => [r.id, r.type, r.countyId ?? null]),
      [
        ['state:WA', 'state', null],
        ['county:53053', 'county', null],
        ['place:5370000', 'place', PIERCE.id],
      ],
    );
    assert.equal(selection[0].seen?.length, ITEMS.length);
    assert.deepEqual([...selectedIds(selection, 'WA')].sort(), [
      PIERCE.id,
      TACOMA.id,
    ]);
  });

  test('other states are left alone and a state can be removed', () => {
    const start = [
      stateEntry('OR'),
      { ...TACOMA, type: 'place' as const, countyId: PIERCE.id },
    ];
    const selection = withStateSelection(
      [stateEntry('OR'), stateEntry('WA')],
      'WA',
      new Set(),
      ITEMS,
    );
    assert.ok(selection.some((r) => r.id === 'state:OR'));
    assert.deepEqual(
      withoutState(selection, 'WA').map((r) => r.id),
      ['state:OR'],
    );
    assert.equal(start.length, 2);
  });

  test('a ticked region the index dropped stays selected', () => {
    const old = withStateSelection(
      [stateEntry('WA')],
      'WA',
      new Set([FIFE.id]),
      ITEMS,
    );
    const next = withStateSelection(old, 'WA', new Set([FIFE.id]), [
      PIERCE,
      TACOMA,
    ]);
    assert.ok(next.some((r) => r.id === FIFE.id));
  });
});

describe('newPlaces', () => {
  test('places added to the index since the state was last edited', () => {
    const saved = withStateSelection([stateEntry('WA')], 'WA', new Set(), [
      PIERCE,
      TACOMA,
    ]);
    assert.deepEqual(
      newPlaces(saved, 'WA', ITEMS).map((r) => r.name),
      ['Seattle', 'Fife', 'Nowhere'],
    );
  });

  test('none before the state was ever edited', () => {
    assert.deepEqual(newPlaces([stateEntry('WA')], 'WA', ITEMS), []);
  });
});
