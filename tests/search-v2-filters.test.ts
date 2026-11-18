import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  activeFiltersOf,
  facetsToFilters,
  locationNote,
  v2FilterPairs,
} from '../src/app/(app)/features/search/v2/v2-contract';
import { buildV2Url } from '../src/app/(app)/features/search/v2/v2-request';
import {
  applyFacetFilters,
  facetsOf,
  readParams,
  resolveRegions,
} from '../prototype/v2-search';
import { CATALOG } from '../src/app/(app)/features/search/sune-demo/sune.mjs';

const url = (qs: string) => new URLSearchParams(qs);

test('v2FilterPairs: filters and area params only, filters sorted, repeated values kept', () => {
  const pairs = v2FilterPairs(
    url(
      'query=food&needs=N-FOD&filters[languages]=Spanish&filters[age_group][1]=b&filters[age_group][0]=a&region=county:53073&region=county:53077&area_match=serving&unlocated=all&age=30&foo=bar&evil[x]=1&filters[a b]=x&filters[]=x',
    ),
  );
  assert.deepEqual(pairs, [
    ['region', 'county:53073'],
    ['region', 'county:53077'],
    ['area_match', 'serving'],
    ['unlocated', 'all'],
    ['age', '30'],
    ['filters[age_group][0]', 'a'],
    ['filters[age_group][1]', 'b'],
    ['filters[languages]', 'Spanish'],
  ]);
});

test('v2FilterPairs: the same filters in another order are the same call', () => {
  const a = v2FilterPairs(url('filters[l]=x&filters[k]=y'));
  const b = v2FilterPairs(url('filters[k]=y&filters[l]=x'));
  assert.deepEqual(a, b);
});

test('buildV2Url forwards filters, age and the area params, and still never needs filters', () => {
  const incoming = url(
    'query=food&filters[languages][0]=Spanish&region=county:53073&area_match=located&unlocated=none&age=7&organization_id=org-1&geo_type=proximity&junk=1',
  );
  const out = new URL(buildV2Url('http://api', incoming, 't1'));
  assert.equal(out.pathname, '/v2/search');
  assert.equal(out.searchParams.get('filters[languages][0]'), 'Spanish');
  assert.equal(out.searchParams.get('region'), 'county:53073');
  assert.equal(out.searchParams.get('area_match'), 'located');
  assert.equal(out.searchParams.get('unlocated'), 'none');
  assert.equal(out.searchParams.get('age'), '7');
  assert.equal(out.searchParams.get('organization_id'), 'org-1');
  assert.equal(out.searchParams.get('geo_type'), 'proximity');
  assert.equal(out.searchParams.get('junk'), null);
  assert.equal(out.searchParams.get('tenant_id'), 't1');
});

test('buildV2Url with a get-only reader still builds (no filters)', () => {
  const out = new URL(buildV2Url('http://api', { get: () => null }, 't1'));
  assert.equal(out.searchParams.get('tenant_id'), 't1');
});

test('facetsToFilters: v1 panel shape, English value is the key, empty facets dropped', () => {
  const filters = facetsToFilters([
    {
      key: 'languages',
      name: { en: 'Languages', locale: 'Idiomas' },
      values: [{ en: 'Spanish', locale: 'Español', doc_count: 7 }],
    },
    { key: 'empty', name: { en: 'E', locale: 'E' }, values: [] },
  ]);
  assert.deepEqual(filters, {
    languages: {
      name: 'Idiomas',
      buckets: [{ key: 'Spanish', display: 'Español', doc_count: 7 }],
    },
  });
});

test('facetsToFilters: no facet list gives undefined; {} (older server) too', () => {
  assert.equal(facetsToFilters(undefined), undefined);
  assert.equal(facetsToFilters({}), undefined);
});

test('facetsToFilters: a ticked value missing from the counts stays with 0', () => {
  const filters = facetsToFilters(
    [
      {
        key: 'languages',
        name: { en: 'L', locale: 'L' },
        values: [{ en: 'English', locale: 'English', doc_count: 3 }],
      },
    ],
    { languages: ['Spanish', 'English'], gone: ['x'] },
  );
  assert.deepEqual(filters?.languages.buckets, [
    { key: 'English', display: 'English', doc_count: 3 },
    { key: 'Spanish', display: 'Spanish', doc_count: 0 },
  ]);
  assert.equal(filters?.gone, undefined);
});

test('activeFiltersOf reads the three bracket forms', () => {
  assert.deepEqual(
    activeFiltersOf(
      url('filters[languages]=Spanish&filters[age_group][0]=a&filters[age_group][]=b&filters[age_group][]=a'),
    ),
    { languages: ['Spanish'], age_group: ['a', 'b'] },
  );
});

test('locationNote: names the Regions, nothing without them', () => {
  const base = { area_match: 'located' as const, unlocated: 'none' as const };
  assert.equal(locationNote(undefined), null);
  assert.equal(locationNote({ ...base, regions: [] }), null);
  assert.equal(
    locationNote({ ...base, regions: [{ id: 'county:1', name: 'Jackson County, MO' }] }),
    'Showing results near Jackson County, MO',
  );
  assert.equal(
    locationNote({
      ...base,
      regions: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ],
    }),
    'Showing results near A, B and C',
  );
});

test('stub: filters filter (values AND), facet counts are for the filtered set', () => {
  const all = CATALOG;
  const spanish = applyFacetFilters(all, { languages: ['Spanish'] });
  assert.ok(spanish.length > 0 && spanish.length < all.length);
  const both = applyFacetFilters(all, { languages: ['Spanish', 'Vietnamese'] });
  assert.ok(both.length <= spanish.length);
  const facets = facetsOf(spanish);
  const lang = facets.find((f) => f.key === 'languages')!;
  assert.equal(lang.values.find((v) => v.en === 'Spanish')?.doc_count, spanish.length);
});

test('stub: readParams reads filters, region, area_match, unlocated', () => {
  const p = readParams(
    url('query=x&filters[languages]=Spanish&filters[age_group][0]=Seniors&region=county:53073,zip:98225&area_match=serving&unlocated=all'),
  );
  assert.deepEqual(p.filters, { languages: ['Spanish'], age_group: ['Seniors'] });
  assert.deepEqual(p.region, ['county:53073', 'zip:98225']);
  assert.equal(p.areaMatch, 'serving');
  assert.equal(p.unlocated, 'all');
});

test('stub: resolved_location for known Regions, 400 for an unknown one', () => {
  assert.equal(resolveRegions({ region: [] }), undefined);
  const r = resolveRegions({ region: ['county:53073'] });
  assert.equal(r?.regions[0].name, 'Whatcom County, WA');
  assert.equal(r?.area_match, 'located_or_serving');
  assert.throws(() => resolveRegions({ region: ['county:00000'] }), { status: 400 });
});
