import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { V2Response } from '../src/app/(app)/features/search/v2/v2-contract';
import {
  seedHits,
  seedMatches,
  seedTotal,
  shortText,
  showsResultsView,
  v2CallString,
} from '../src/app/(app)/features/search/v2/v2-seed';

const response = (hits: unknown[], total: unknown = hits.length) =>
  ({ search: { hits: { total, hits } } }) as unknown as V2Response;

test('seedHits: name, organization, short text and link', () => {
  const [hit] = seedHits(
    response([
      {
        _id: 'abc 1',
        _source: {
          name: 'Helping Hands',
          service: { name: 'Food Pantry', summary: 'Free groceries.' },
          organization: { alternate_name: 'Helping Hands Inc' },
        },
      },
    ]),
  );
  assert.deepEqual(hit, {
    id: 'abc 1',
    name: 'Food Pantry',
    organization: 'Helping Hands Inc',
    text: 'Free groceries.',
    href: '/search/abc%201',
  });
});

test('seedHits: drops nameless hits, caps the list, survives an empty or missing response', () => {
  assert.deepEqual(seedHits(null), []);
  assert.deepEqual(seedHits(response([])), []);
  const hits = [
    { _id: 'x', _source: {} },
    { _id: 'y', _source: { name: 'Y' } },
  ];
  assert.deepEqual(
    seedHits(response(hits)).map((h) => h.id),
    ['y'],
  );
  const many = Array.from({ length: 40 }, (_, i) => ({
    _id: String(i),
    _source: { name: `N${i}` },
  }));
  assert.equal(seedHits(response(many)).length, 25);
  assert.equal(seedHits(response(many), 3).length, 3);
});

test('seedHits: organization equal to the name is not repeated', () => {
  const [hit] = seedHits(response([{ _id: '1', _source: { name: 'Solo' } }]));
  assert.equal(hit.organization, null);
});

test('shortText cuts at a word end with an ellipsis', () => {
  assert.equal(shortText('short  text'), 'short text');
  const cut = shortText('word '.repeat(100), 50);
  assert.ok(cut.endsWith('…') && cut.length <= 51);
});

test('seedTotal reads both total shapes', () => {
  assert.equal(seedTotal(response([], { value: 7 })), 7);
  assert.equal(seedTotal(response([], 3)), 3);
  assert.equal(seedTotal(null), 0);
});

test('seedMatches needs the same tenant and call string', () => {
  const seed = { tenantId: 't', callString: 'query=a' };
  assert.equal(seedMatches(seed, 't', 'query=a'), true);
  assert.equal(seedMatches(seed, 't', 'query=b'), false);
  assert.equal(seedMatches(seed, 'u', 'query=a'), false);
  assert.equal(seedMatches(null, 't', 'query=a'), false);
});

test('showsResultsView: a query without refine=1 is the results view (Q4 = A)', () => {
  const p = (s: string) => new URLSearchParams(s);
  assert.equal(showsResultsView(p('query=food')), true);
  assert.equal(showsResultsView(p('query=food&refine=1')), false);
  assert.equal(showsResultsView(p('')), false);
  assert.equal(showsResultsView(p('query=%20')), false);
});

test('v2CallString keeps only call keys, drops N-X, in a stable order', () => {
  const p = new URLSearchParams(
    'refine=1&asked=x&page=2&query=food&needs=N-X,N-FOD-01&locale=en',
  );
  assert.equal(v2CallString(p), 'query=food&needs=N-FOD-01&page=2');
});

test('v2CallString puts facet filters in the key, so a filtered URL is not the unfiltered seed', () => {
  const plain = v2CallString(new URLSearchParams('query=food'));
  const filtered = v2CallString(new URLSearchParams('query=food&filters[lang]=es'));
  assert.notEqual(plain, filtered);
  assert.match(filtered, /filters/);
});
