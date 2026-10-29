// The search page lifts once per request, cached by the query string rebuilt from Next's searchParams.
// The key must lift exactly as the params do, and metadata and the page (separate objects) must share it.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  liftSearchParams,
  rawSearchParams,
} from '../src/app/(app)/features/search/intent';
import {
  liftSearchRequest,
  searchRequestKey,
} from '../src/app/(app)/features/search/utils/liftSearchRequest';

import { ALL_FIXTURES } from './search-intent-fixtures';

test('the request key lifts exactly as the params it was built from', () => {
  for (const { name, query } of ALL_FIXTURES) {
    const raw = rawSearchParams(query);
    assert.deepStrictEqual(liftSearchRequest(raw), liftSearchParams(raw), name);
  }
});

test('metadata and the page share the key: separate objects for one URL give the same key', () => {
  for (const { name, query } of ALL_FIXTURES) {
    const forMetadata = rawSearchParams(query);
    const forPage = rawSearchParams(query);
    assert.notEqual(forMetadata, forPage);
    assert.equal(
      searchRequestKey(forMetadata),
      searchRequestKey(forPage),
      name,
    );
  }
});
