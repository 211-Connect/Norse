import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPinsUrl,
  pinsCallString,
  usablePins,
} from '../src/app/(app)/features/search/v2/v2-pins';

const page = new URLSearchParams(
  'query=food&needs=N-FOD&passed_needs=N-HOU&urgency=U-2&clarify=never&page=3&region=r1&area_match=within&unlocated=include&coords=-76.1,43.0&distance=10&filters[language][0]=es&asked=a&refine=1',
);

test('pinsCallString: keeps result-changing params, drops paging and answer-only params', () => {
  const call = new URLSearchParams(pinsCallString(page));
  assert.equal(call.get('query'), 'food');
  assert.equal(call.get('needs'), 'N-FOD');
  assert.equal(call.get('region'), 'r1');
  assert.equal(call.get('area_match'), 'within');
  assert.equal(call.get('unlocated'), 'include');
  assert.equal(call.get('coords'), '-76.1,43.0');
  assert.equal(call.get('distance'), '10');
  assert.equal(call.get('filters[language][0]'), 'es');
  for (const k of [
    'page',
    'passed_needs',
    'urgency',
    'clarify',
    'asked',
    'refine',
  ]) {
    assert.equal(call.has(k), false, k);
  }
});

test('pinsCallString: order does not matter (stable cache key)', () => {
  const a = pinsCallString(new URLSearchParams('query=a&needs=N-FOD'));
  const b = pinsCallString(new URLSearchParams('needs=N-FOD&query=a'));
  assert.equal(a, b);
});

test('buildPinsUrl: path /v2/search/pins, tenant_id and locale in the URL', () => {
  const url = new URL(buildPinsUrl('http://api', page, 'T-1'));
  assert.equal(url.pathname, '/v2/search/pins');
  assert.equal(url.searchParams.get('tenant_id'), 'T-1');
  assert.equal(url.searchParams.get('locale'), 'en');
  const es = new URL(
    buildPinsUrl('http://api', new URLSearchParams('query=x&locale=es'), 'T-1'),
  );
  assert.equal(es.searchParams.get('locale'), 'es');
});

test('usablePins: drops pins without an id or a lon,lat pair; tolerates a bad body', () => {
  const ok = {
    id: 'a',
    service_at_location_id: 's',
    name: 'n',
    physical_address: null,
    coordinates: [-76, 43],
  };
  const pins = usablePins({
    pins: [
      ok,
      { ...ok, id: 'b', coordinates: [NaN, 1] },
      { ...ok, id: 'c', coordinates: [1] },
      { ...ok, id: undefined },
    ] as never,
  });
  assert.deepEqual(
    pins.map((p) => p.id),
    ['a'],
  );
  assert.deepEqual(usablePins(null), []);
  assert.deepEqual(usablePins({} as never), []);
});
