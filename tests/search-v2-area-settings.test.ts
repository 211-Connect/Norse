import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  addAreaSettings,
  areaSettingsOf,
} from '../src/app/(app)/features/search/utils/area-settings';
import { buildPinsUrl } from '../src/app/(app)/features/search/v2/v2-pins';
import { resolveV2HostTenant } from '../src/app/(app)/features/search/v2/v2-host-tenant';
import { buildV2Url } from '../src/app/(app)/features/search/v2/v2-request';

const settings = { areaMatch: 'serving', unlocatedInAreaSearch: 'all' };
const get = (url: string, key: string) => new URL(url).searchParams.get(key);

test('an area search carries the tenant settings on /v2/search', () => {
  const page = new URLSearchParams('region=county:53033&query=food');
  const url = buildV2Url('http://api', page, 't1', settings);
  assert.equal(get(url, 'area_match'), 'serving');
  assert.equal(get(url, 'unlocated'), 'all');
});

test('the pins call sends the same settings as the list call', () => {
  const page = new URLSearchParams('region=county:53033&query=food');
  const list = new URL(buildV2Url('http://api', page, 't1', settings));
  const pins = new URL(buildPinsUrl('http://api', page, 't1', settings));
  for (const key of ['area_match', 'unlocated', 'region']) {
    assert.equal(pins.searchParams.get(key), list.searchParams.get(key), key);
  }
});

test('a search without region sends no area settings (not an area search)', () => {
  const page = new URLSearchParams('query=food&coords=47.6,-122.3');
  const url = buildV2Url('http://api', page, 't1', settings);
  assert.equal(get(url, 'area_match'), null);
  assert.equal(get(url, 'unlocated'), null);
});

test('a value the page URL already has wins over the tenant setting', () => {
  const page = new URLSearchParams(
    'region=state:WA&area_match=located&unlocated=none',
  );
  const url = buildV2Url('http://api', page, 't1', settings);
  assert.equal(get(url, 'area_match'), 'located');
  assert.equal(get(url, 'unlocated'), 'none');
});

test('failed or missing settings send nothing, so Norse-API applies its own default', () => {
  const page = new URLSearchParams('region=state:WA');
  for (const bad of [
    undefined,
    null,
    {},
    { areaMatch: 'bogus', unlocatedInAreaSearch: 42 },
  ]) {
    const url = buildV2Url('http://api', page, 't1', bad);
    assert.equal(get(url, 'area_match'), null);
    assert.equal(get(url, 'unlocated'), null);
    assert.equal(get(url, 'region'), 'state:WA');
  }
  const out = new URLSearchParams('region=state:WA');
  addAreaSettings(out, { areaMatch: 'located' });
  assert.equal(out.get('area_match'), 'located');
  assert.equal(out.has('unlocated'), false);
});

test('v1 and v2 read the same setting through one function', () => {
  assert.deepEqual(areaSettingsOf(settings), {
    areaMatch: 'serving',
    unlocated: 'all',
  });
  const page = readFileSync(
    'src/app/(app)/[locale]/(rest)/search/page.tsx',
    'utf8',
  );
  assert.match(page, /\.\.\.areaSettingsForQuery\(\s*appConfig\.search,/);
  assert.doesNotMatch(page, /areaMatch: appConfig\.search\.areaMatch/);
});

test('the host-tenant check hands the tenant settings to the route; a config with none stays ok', async () => {
  const base = {
    tenantId: 'T',
    featureFlags: { enableV2Api: true },
    i18n: { locales: ['en'] },
  };
  const deps = (search?: object) => ({
    getConfig: async () => ({ ...base, search }),
    isValidLocale: () => true,
  });
  const withSearch = await resolveV2HostTenant('en', deps(settings));
  assert.ok(withSearch.ok && withSearch.search?.areaMatch === 'serving');
  const without = await resolveV2HostTenant('en', deps());
  assert.ok(without.ok && without.search === undefined);
});

test('the v2 routes pass the settings on (the seam: route to URL builder)', () => {
  const route = readFileSync('src/app/(app)/api/v2-search/route.ts', 'utf8');
  assert.match(
    route,
    /buildV2Url\(API_URL, incoming, host\.tenantId, host\.search\)/,
  );
  const pins = readFileSync('src/app/(app)/api/search-pins/route.ts', 'utf8');
  assert.match(pins, /appConfig\.search/);
});

test('pins: a caller value wins, and one setting alone is sent alone', () => {
  const page = new URLSearchParams('region=state:WA&area_match=located');
  const pins = new URL(
    buildPinsUrl('http://api', page, 't1', { unlocatedInAreaSearch: 'none' }),
  );
  assert.equal(pins.searchParams.get('area_match'), 'located');
  assert.equal(pins.searchParams.get('unlocated'), 'none');
  const only = new URL(
    buildPinsUrl('http://api', new URLSearchParams('region=state:WA'), 't1', {
      areaMatch: 'serving',
    }),
  );
  assert.equal(only.searchParams.get('area_match'), 'serving');
  assert.equal(only.searchParams.has('unlocated'), false);
});
