// Prototype round 17: the v2 slots (needs, passed_needs, urgency, other, refine, asked).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liftQueryString,
  serializeSearch,
} from '../src/app/(app)/features/search/intent';
import { toFindResourcesQuery } from '../src/app/(app)/features/search/intent/legacy';

const URL_ =
  'query=rent&needs=N-HOU-02,N-HOU-02,bogus,N-X&passed_needs=N-MON-02&urgency=U-2&other=no+car&refine=1&asked=start,area:N-HOU,location';

test('v2 slots read codes in URL order, without repeats or invalid codes', () => {
  const { intent } = liftQueryString(URL_);
  assert.deepStrictEqual(intent.needs, { stated: true, value: ['N-HOU-02', 'N-X'] });
  assert.deepStrictEqual(intent.passedNeeds, { stated: true, value: ['N-MON-02'] });
  assert.deepStrictEqual(intent.urgency, { stated: true, value: 'U-2' });
  assert.deepStrictEqual(intent.other, { stated: true, value: 'no car' });
  assert.deepStrictEqual(intent.refine, { stated: true, value: true });
  assert.deepStrictEqual(intent.asked, {
    stated: true,
    value: ['start', 'area:N-HOU', 'location'],
  });
});

test('U-0 never reads from a URL: an emergency answer must not live in a shared link', () => {
  const { intent } = liftQueryString('query=help&urgency=U-0');
  assert.deepStrictEqual(intent.urgency, { stated: false });
});

test('an absent v2 key stays unstated', () => {
  const { intent } = liftQueryString('query=food');
  for (const slot of ['needs', 'passedNeeds', 'urgency', 'other', 'refine', 'asked'] as const) {
    assert.deepStrictEqual(intent[slot], { stated: false }, slot);
  }
});

test('v2 slots write back to the same intent', () => {
  const lifted = liftQueryString(URL_);
  const again = liftQueryString(serializeSearch(lifted.intent, lifted.envelope));
  assert.deepStrictEqual(again.intent, lifted.intent);
});

test('needs, passed needs, urgency and Other text reach the search call; refine and asked do not', () => {
  const query = toFindResourcesQuery(liftQueryString(URL_).intent);
  assert.deepStrictEqual(query.needs, ['N-HOU-02', 'N-X']);
  assert.deepStrictEqual(query.passedNeeds, ['N-MON-02']);
  assert.equal(query.urgency, 'U-2');
  assert.equal(query.other, 'no car');
  assert.equal('refine' in query, false);
  assert.equal('asked' in query, false);
});
