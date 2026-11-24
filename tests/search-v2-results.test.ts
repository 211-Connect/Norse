import assert from 'node:assert/strict';
import test from 'node:test';

import type { ResultType } from '../src/app/(app)/shared/store/results';
import {
  hitToResult,
  weakMatchText,
  v2Results,
  v2CallFailed,
} from '../src/app/(app)/features/search/v2/v2-results';
import type { V2Response } from '../src/app/(app)/features/search/v2/v2-contract';

const response = (
  ids: string[],
  total: number | { value: number } = ids.length,
): V2Response =>
  ({
    search: {
      hits: {
        total,
        hits: ids.map((id) => ({
          _id: id,
          _source: {
            service_at_location_id: `sal-${id}`,
            name: `Place ${id}`,
            phone: '555-0100',
            url: 'example.org',
            service: { name: `Service ${id}`, summary: 'Hot meals' },
            location: {
              name: 'Hall',
              physical_address: {
                address_1: '1 Main St',
                city: 'Bellingham',
                state_province: 'WA',
                postal_code: '98225',
              },
            },
          },
        })),
      },
    },
  }) as unknown as V2Response;

test('hitToResult maps a v2 hit like the v1 card data and leaves out missing fields', () => {
  const r = hitToResult(response(['a']).search.hits.hits[0]);
  assert.equal(r._id, 'a');
  assert.equal(r.id, 'sal-a');
  assert.equal(r.serviceName, 'Service a');
  assert.equal(r.website, 'https://example.org');
  assert.match(r.address, /1 Main St/);
  assert.equal('alert' in r, false);
});

test('v2Results is null until the v2 answer is here, so the v1 cards stay', () => {
  assert.equal(v2Results(undefined, []), null);
  assert.equal(v2Results(null, []), null);
});

test('v2Results takes the server order and the v2 total; services outside the area drop out of the list', () => {
  const v1 = [
    { _id: 'far', name: 'Far away' },
    { _id: 'b', name: 'V1 B', facets: [{ key: 'x' }] },
  ] as unknown as ResultType[];
  const out = v2Results(response(['a', 'b'], { value: 7 }), v1)!;
  assert.deepEqual(
    out.results.map((r) => r._id),
    ['a', 'b'],
  );
  assert.equal(out.totalResults, 7);
  // A service both searches returned keeps its richer v1 card data; the v1-only one is gone.
  assert.equal(out.results[1].name, 'V1 B');
  assert.equal(
    out.results.some((r) => r._id === 'far'),
    false,
  );
});

test('v2Results with no hits is an empty list, not the v1 list', () => {
  const out = v2Results(response([], 0), [
    { _id: 'far' },
  ] as unknown as ResultType[])!;
  assert.deepEqual(out.results, []);
  assert.equal(out.totalResults, 0);
});

test('a v2-only hit gets translated facets from the response facet list', () => {
  const data = {
    search: {
      hits: {
        total: 1,
        hits: [
          { _id: 'a', _source: { name: 'A', facets: { lang: ['Spanish'] } } },
        ],
      },
    },
    facets: [
      {
        key: 'lang',
        name: { en: 'Language', locale: 'Idioma' },
        values: [],
      },
    ],
  } as unknown as V2Response;
  const out = v2Results(data, [], 'es');
  const facets = (out?.results[0] as any).facets;
  assert.equal(facets.length, 1);
  assert.equal(facets[0].taxonomyName, 'Idioma');
  assert.equal(facets[0].taxonomyNameEn, 'Language');
  assert.equal(facets[0].termName, 'Spanish');
});

test('a hit with no facets has no facets key', () => {
  const out = hitToResult({ _id: 'a', _source: { name: 'A' } });
  assert.equal('facets' in out, false);
});

test('weakMatchText: the tenant text wins', () => {
  assert.equal(weakMatchText('  Call us!  ', '555'), 'Call us!');
});

test('weakMatchText: empty or blank text falls back', () => {
  const fallback = 'No results found for your search. Need help? Call 555.';
  assert.equal(weakMatchText('', '555'), fallback);
  assert.equal(weakMatchText('   ', '555'), fallback);
  assert.equal(weakMatchText(undefined, '555'), fallback);
});

test('weakMatchText: the fallback uses 211 without a number', () => {
  assert.equal(
    weakMatchText(undefined, undefined),
    'No results found for your search. Need help? Call 211.',
  );
});

// Item 6: a failed v2 call is an error state with retry, never the v1 cards.
test('v2CallFailed: the table', () => {
  const ok = response(['a']);
  const base = {
    v2On: true,
    query: 'rent',
    data: undefined as V2Response | undefined,
    isError: false,
    failureCount: 0,
  };
  const failed = (over: Partial<typeof base>) =>
    v2CallFailed({ ...base, ...over });
  // Still loading: not failed (the v1 cards stay until the answer is here).
  assert.equal(failed({}), false);
  // The call errored, or is failing and retrying.
  assert.equal(failed({ isError: true }), true);
  assert.equal(failed({ failureCount: 1 }), true);
  // A response with no hit list is unusable.
  assert.equal(failed({ data: {} as V2Response }), true);
  assert.equal(failed({ data: { search: {} } as V2Response }), true);
  // A background refetch that failed keeps the data it has.
  assert.equal(failed({ data: ok, isError: true, failureCount: 3 }), false);
  assert.equal(failed({ data: ok }), false);
  // An empty hit list is a real answer, not a failure.
  assert.equal(failed({ data: response([]) }), false);
  // v2 off or no query: v1 untouched, whatever the hook says.
  assert.equal(failed({ v2On: false, isError: true }), false);
  assert.equal(failed({ query: '', isError: true, failureCount: 2 }), false);
});
