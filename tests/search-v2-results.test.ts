import assert from 'node:assert/strict';
import test from 'node:test';

import type { ResultType } from '../src/app/(app)/shared/store/results';
import { hitToResult, v2Results } from '../src/app/(app)/features/search/v2/v2-results';
import type { V2Response } from '../src/app/(app)/features/search/v2/v2-contract';

const response = (ids: string[], total: number | { value: number } = ids.length): V2Response =>
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
            location: { name: 'Hall', physical_address: { address_1: '1 Main St', city: 'Bellingham', state_province: 'WA', postal_code: '98225' } },
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
  const v1 = [{ _id: 'far', name: 'Far away' }, { _id: 'b', name: 'V1 B', facets: [{ key: 'x' }] }] as unknown as ResultType[];
  const out = v2Results(response(['a', 'b'], { value: 7 }), v1)!;
  assert.deepEqual(out.results.map((r) => r._id), ['a', 'b']);
  assert.equal(out.totalResults, 7);
  // A service both searches returned keeps its richer v1 card data; the v1-only one is gone.
  assert.equal(out.results[1].name, 'V1 B');
  assert.equal(out.results.some((r) => r._id === 'far'), false);
});

test('v2Results with no hits is an empty list, not the v1 list', () => {
  const out = v2Results(response([], 0), [{ _id: 'far' }] as unknown as ResultType[])!;
  assert.deepEqual(out.results, []);
  assert.equal(out.totalResults, 0);
});
