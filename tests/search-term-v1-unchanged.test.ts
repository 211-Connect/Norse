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
    /searchTermFromUrl\(\{[^}]*v2: appConfig\.featureFlags\.enableV2Api/,
  );
});

// Regression (checker 2026-11-23, DOM diff with enableV2Api off vs development): the card order and a
// wrapper element changed for v1 tenants.
import {
  DEFAULT_SEARCH_CARD_LAYOUT,
  V2_DEFAULT_SEARCH_CARD_LAYOUT,
} from '../src/app/(app)/features/search/types/card-layout-config';

const ids = (l: { componentId: string }[]) => l.map((c) => c.componentId);

test("v1 default card layout keeps the development order (What's Here after the description)", () => {
  const v1 = ids(DEFAULT_SEARCH_CARD_LAYOUT);
  assert.ok(v1.indexOf('categories') > v1.indexOf('description'));
  assert.deepEqual(v1, [
    'badges',
    'resourceName',
    'serviceName',
    'address',
    'phone',
    'website',
    'description',
    'categories',
    'separator',
    'actionButtons',
  ]);
});

test("v2 default card layout puts What's Here right below the name", () => {
  const v2 = ids(V2_DEFAULT_SEARCH_CARD_LAYOUT);
  assert.equal(v2.indexOf('categories'), v2.indexOf('serviceName') + 1);
});

test('buildAppConfig picks the v2 layout only when enableV2Api is on', () => {
  const s = readFileSync(
    'src/app/(app)/shared/utils/buildAppConfig.ts',
    'utf8',
  );
  assert.match(
    s,
    /enableV2Api\s*\?\s*V2_DEFAULT_SEARCH_CARD_LAYOUT\s*:\s*DEFAULT_SEARCH_CARD_LAYOUT/,
  );
});

test('render-results: the card wrapper element exists only with the v2 switch on', () => {
  const s = readFileSync(
    'src/app/(app)/features/search/components/render-results-v2.tsx',
    'utf8',
  );
  assert.match(s, /return v2 \? \(\s*<div[\s\S]*?data-search-result/);
  assert.match(s, /<Fragment key=\{result\._id\}>\{card\}<\/Fragment>/);
});

test('page-wrapper: the footer has a wrapper element only on the v2 fit-viewport pages', () => {
  const s = readFileSync(
    'src/app/(app)/shared/components/page-wrapper.tsx',
    'utf8',
  );
  assert.match(
    s,
    /\{fit \? \(\s*<div className="md:hidden">\s*<Footer \/>\s*<\/div>\s*\) : \(\s*<Footer \/>\s*\)\}/,
  );
});

test('autocomplete: the empty-box blur skip is opt-in (v2 location bar only), so v1 keeps its blur pick', () => {
  const hook = readFileSync(
    'src/app/(app)/shared/components/ui/autocomplete/use-autocomplete.ts',
    'utf8',
  );
  assert.match(
    hook,
    /!\(skipBlurPickWhenEmpty && inputText\.trim\(\) === ''\)/,
  );
  const bar = readFileSync(
    'src/app/(app)/shared/components/search/location-search-bar.tsx',
    'utf8',
  );
  assert.match(bar, /skipBlurPickWhenEmpty=\{clearOnlyEmpties\}/);
  assert.match(bar, /const clearOnlyEmpties = rankEverywhere && !isStandalone/);
});
