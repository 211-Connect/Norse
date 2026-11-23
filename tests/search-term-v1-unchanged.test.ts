// Regression (checker 2026-11-23): with enableV2Api off, the v1 /search box showed the query text
// where development shows the placeholder. Cause: commit e6284d32 applied the v2 fallback to every tenant.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { searchTermFromUrl } from '../src/app/(app)/shared/lib/search-term-from-url';

const url = { query: 'food', queryLabel: '', queryType: '' };

test('v2 off: a link with query and no query_label shows no words (v1 as on development)', () => {
  assert.equal(searchTermFromUrl({ ...url, v2: false }), '');
  assert.equal(searchTermFromUrl({ ...url, queryType: 'text', v2: false }), '');
});

test('v2 off: query_label still wins, as in v1', () => {
  assert.equal(
    searchTermFromUrl({ ...url, queryLabel: 'Food help', v2: false }),
    'Food help',
  );
});

test('v2 on: query shows when there is no query_label; taxonomy codes do not', () => {
  assert.equal(searchTermFromUrl({ ...url, v2: true }), 'food');
  assert.equal(
    searchTermFromUrl({ ...url, queryType: 'hybrid', v2: true }),
    'food',
  );
  assert.equal(
    searchTermFromUrl({ ...url, queryType: 'taxonomy', v2: true }),
    '',
  );
});

test('search-state-sync passes the tenant switch to the helper', () => {
  const s = readFileSync(
    'src/app/(app)/shared/components/search-state-sync.tsx',
    'utf8',
  );
  assert.match(
    s,
    /searchTermFromUrl\(\{[^}]*v2: appConfig\.featureFlags\.enableV2Api/s,
  );
});
