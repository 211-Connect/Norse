import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildV2Url,
  v2ApiPath,
} from '../src/app/(app)/features/search/v2/v2-request';

test('buildV2Url forwards the incoming limit', () => {
  const url = buildV2Url(
    'http://api',
    new URLSearchParams('query=food&limit=10'),
    't1',
  );
  assert.equal(new URL(url).searchParams.get('limit'), '10');
});

test('v2ApiPath puts the limit before the call string', () => {
  assert.equal(
    v2ApiPath('t1', 'query=food', 10),
    '/api/v2-search?tenant_id=t1&limit=10&query=food',
  );
});

test('v2ApiPath leaves out a missing or non-positive limit', () => {
  assert.equal(
    v2ApiPath('t1', 'query=food'),
    '/api/v2-search?tenant_id=t1&query=food',
  );
  assert.equal(
    v2ApiPath('t1', 'query=food', 0),
    '/api/v2-search?tenant_id=t1&query=food',
  );
  assert.equal(v2ApiPath(undefined, ''), '/api/v2-search?tenant_id=');
});
