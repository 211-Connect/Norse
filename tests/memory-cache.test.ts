import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isCommonSearch } from '../src/app/(app)/shared/lib/common-search';
import type { FindResourcesQuery } from '../src/app/(app)/shared/services/search-service';
import {
  MEMORY_CACHE_LIMITS,
  cacheFeatureOf,
  clearMemoryCache,
  memoryCacheStats,
  withCache,
} from '../src/utilities/withCache';

const memoryOnly = { memory: true, redis: false } as const;

test('cacheFeatureOf: the key up to the first colon', () => {
  assert.equal(cacheFeatureOf('search_results:t1:en:abc'), 'search_results');
  assert.equal(cacheFeatureOf('tenant:example.org'), 'tenant');
});

test('each feature has its own memory cache', async () => {
  clearMemoryCache();
  await withCache('tenant:a', async () => ({ id: 'a' }), memoryOnly);
  await withCache('search_config:a:en', async () => ({ x: 1 }), memoryOnly);

  const stats = memoryCacheStats();
  assert.equal(stats.tenant.entries, 1);
  assert.equal(stats.search_config.entries, 1);
});

test('a second read is served from memory without fetching', async () => {
  clearMemoryCache();
  let fetches = 0;
  const fetch = async () => {
    fetches += 1;
    return { id: 'a' };
  };
  await withCache('tenant:b', fetch, memoryOnly);
  const second = await withCache('tenant:b', fetch, memoryOnly);
  assert.equal(fetches, 1);
  assert.deepEqual(second, { id: 'a' });
});

test('filling one feature never evicts another', async () => {
  clearMemoryCache();
  await withCache('tenant:keep', async () => ({ id: 'keep' }), memoryOnly);

  const max = MEMORY_CACHE_LIMITS.search_results!.maxEntries;
  for (let i = 0; i < max + 50; i += 1) {
    await withCache(
      `search_results:t:en:${i}`,
      async () => ({ results: [i] }),
      memoryOnly,
    );
  }

  const stats = memoryCacheStats();
  assert.equal(stats.search_results.entries, max);
  assert.equal(stats.tenant.entries, 1);
});

test('a value bigger than a quarter of the budget is not kept', async () => {
  clearMemoryCache();
  const { maxBytes } = MEMORY_CACHE_LIMITS.region_area!;
  const big = 'x'.repeat(Math.ceil(maxBytes / 4) + 10);
  let fetches = 0;
  const fetch = async () => {
    fetches += 1;
    return big;
  };

  const first = await withCache('region_area:big', fetch, memoryOnly);
  const second = await withCache('region_area:big', fetch, memoryOnly);
  assert.equal(first, big);
  assert.equal(second, big);
  assert.equal(fetches, 2);
  assert.equal(memoryCacheStats().region_area?.entries ?? 0, 0);
});

test('a feature never holds more bytes than its budget', async () => {
  clearMemoryCache();
  const { maxBytes } = MEMORY_CACHE_LIMITS.region_area!;
  const chunk = 'y'.repeat(Math.floor(maxBytes / 5));
  for (let i = 0; i < 20; i += 1) {
    await withCache(`region_area:${i}`, async () => chunk, memoryOnly);
  }
  const stats = memoryCacheStats().region_area;
  assert.ok(stats.bytes <= maxBytes, `${stats.bytes} > ${maxBytes}`);
  assert.ok(stats.entries > 0);
});

test('clearMemoryCache empties every feature', async () => {
  await withCache('tenant:c', async () => ({ id: 'c' }), memoryOnly);
  clearMemoryCache();
  for (const { entries } of Object.values(memoryCacheStats())) {
    assert.equal(entries, 0);
  }
});

test('isCommonSearch: first page of a plain category search', () => {
  const common = { queryType: 'taxonomy', query: 'BD-1800' };
  assert.equal(isCommonSearch(common, 1), true);
  assert.equal(isCommonSearch({ ...common, filters: {} }, 1), true);
  assert.equal(
    isCommonSearch({ ...common, filters: { lang: [] } }, 1),
    true,
    'an empty filter list is no filter',
  );
});

test('isCommonSearch: anything narrower is not common', () => {
  const common: FindResourcesQuery = {
    queryType: 'taxonomy',
    query: 'BD-1800',
  };
  const cases: [string, FindResourcesQuery, number][] = [
    ['page 2', common, 2],
    ['text search', { ...common, queryType: 'text' }, 1],
    ['filters', { ...common, filters: { lang: ['es'] } }, 1],
    ['location', { ...common, location: 'Seattle' }, 1],
    ['coordinates', { ...common, coordinates: [-122.3, 47.6] }, 1],
    ['region', { ...common, region: 'county:53033' }, 1],
    ['organization', { ...common, organizationId: 'org-1' }, 1],
  ];
  for (const [label, query, page] of cases) {
    assert.equal(isCommonSearch(query, page), false, label);
  }
});
