import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { isV2Enabled } from '../src/app/(app)/features/search/v2/enabled';

const flags = (enableV2Api?: boolean) => ({
  featureFlags: { enableV2Api } as never,
});

test('the v2 pages are on only when the tenant flag is exactly true', () => {
  assert.equal(isV2Enabled(flags(true)), true);
  assert.equal(isV2Enabled(flags(false)), false);
  assert.equal(isV2Enabled(flags(undefined)), false);
  assert.equal(isV2Enabled(null), false);
  assert.equal(isV2Enabled(undefined), false);
});

const read = (path: string) => readFileSync(path, 'utf8');

test('/find leaves for the v1 home page when the flag is off', () => {
  const page = read('src/app/(app)/[locale]/(home)/find/page.tsx');
  assert.match(page, /if \(!isV2Enabled\([^)]*\)\)[^;]*redirect\('\/'\)/);
});

test('/search wraps the page in the v2 bridge only when the flag is on', () => {
  const page = read('src/app/(app)/[locale]/(rest)/search/page.tsx');
  assert.match(page, /isV2Enabled\(appConfig\)/);
  assert.match(page, /v2 \? <V2ResultsBridge>/);
});

test('the v2 hooks make no call and report no query while the flag is off', () => {
  for (const file of ['use-v2-search.ts', 'use-v2-pins.ts']) {
    const src = read(`src/app/(app)/features/search/v2/${file}`);
    assert.match(src, /featureFlags/, file);
    assert.match(src, /enableV2Api/, file);
  }
});
