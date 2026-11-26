import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { landingAreas } from '../src/app/(app)/features/landing-pages/lib/areas';
import type {
  LandingLink,
  LandingRegion,
} from '../src/app/(app)/features/landing-pages/lib/types';

const region = (
  id: string,
  type: LandingRegion['type'],
  name: string,
  state = 'WA',
  countyId: string | null = null,
): LandingRegion => ({ id, type, name, state, countyId });

const link = (r: LandingRegion): LandingLink => ({
  path: `food/${r.id}`,
  region: r,
});

const WA = region('state:WA', 'state', 'Washington');
const OR = region('state:OR', 'state', 'Oregon', 'OR');
const PIERCE = region('county:53053', 'county', 'Pierce County, WA');
const KING = region('county:53033', 'county', 'King County, WA');
const TACOMA = region('place:5370000', 'place', 'Tacoma', 'WA', PIERCE.id);
const LAKEWOOD = region('place:5338038', 'place', 'Lakewood', 'WA', PIERCE.id);
const SEATTLE = region('place:5363000', 'place', 'Seattle', 'WA', KING.id);
const LOOSE = region('place:5300001', 'place', 'Alpha', 'WA');
const LOOSE2 = region('place:5300002', 'place', 'Beta', 'WA');

const nearby = [
  WA,
  OR,
  PIERCE,
  KING,
  TACOMA,
  LAKEWOOD,
  SEATTLE,
  LOOSE,
  LOOSE2,
].map(link);
const ids = (links: LandingLink[]) => links.map((l) => l.region.id);

describe('landingAreas', () => {
  test('state: its counties, and the other states', () => {
    const areas = landingAreas(WA, nearby);
    assert.deepEqual(ids(areas.parents), []);
    assert.deepEqual(ids(areas.children), [KING.id, PIERCE.id]);
    assert.deepEqual(ids(areas.siblings), [OR.id]);
  });

  test('state without county pages: its cities', () => {
    const areas = landingAreas(WA, [WA, TACOMA, SEATTLE].map(link));
    assert.deepEqual(ids(areas.children), [SEATTLE.id, TACOMA.id]);
  });

  test("county: its cities, and the state's other counties", () => {
    const areas = landingAreas(PIERCE, nearby);
    assert.deepEqual(ids(areas.parents), [WA.id]);
    assert.deepEqual(ids(areas.children), [LAKEWOOD.id, TACOMA.id]);
    assert.deepEqual(ids(areas.siblings), [KING.id]);
  });

  test("city: the county's other cities", () => {
    const areas = landingAreas(TACOMA, nearby);
    assert.deepEqual(ids(areas.parents), [WA.id, PIERCE.id]);
    assert.deepEqual(ids(areas.children), []);
    assert.deepEqual(ids(areas.siblings), [LAKEWOOD.id]);
  });

  test('city outside any county: the other such cities of the state', () => {
    const areas = landingAreas(LOOSE, nearby);
    assert.deepEqual(ids(areas.parents), [WA.id]);
    assert.deepEqual(ids(areas.siblings), [LOOSE2.id]);
  });
});
