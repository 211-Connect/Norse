import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { landingSearch } from '../src/app/(app)/features/landing-pages/server/landing-search';
import { stableHash } from '../src/utilities/withCache';

const appConfig = {
  search: {
    searchEngine: 'classic',
    areaMatch: 'any',
    unlocatedInAreaSearch: 'virtual',
  },
} as never;

const page = {
  topic: {
    name: 'Food Pantries',
    search: { queryType: 'taxonomy' as const, query: 'BD-1800.2000' },
  },
  region: {
    id: 'county:53053',
    type: 'county' as const,
    name: 'Pierce County, WA',
    state: 'WA',
  },
};

describe('landing search builder', () => {
  test('the job and the plain page build the same search key', async () => {
    const job = await landingSearch(appConfig, page, 'en');
    const route = await landingSearch(appConfig, page, 'en', {});
    const pageOne = await landingSearch(appConfig, page, 'en', { page: '1' });
    assert.equal(stableHash(job.query), stableHash(route.query));
    assert.equal(stableHash(job.query), stableHash(pageOne.query));
  });

  test('an area search on the page region with the topic search', async () => {
    const { query, location } = await landingSearch(appConfig, page, 'en');
    assert.equal(location, 'Pierce County');
    assert.equal(query.region, 'county:53053');
    assert.equal(query.location, 'Pierce County');
    assert.equal(query.queryType, 'taxonomy');
    assert.equal(query.areaMatch, 'any');
  });

  test('refinements change the key, other query keys do not', async () => {
    const base = await landingSearch(appConfig, page, 'en');
    const sorted = await landingSearch(appConfig, page, 'en', { sort: 'name' });
    const noise = await landingSearch(appConfig, page, 'en', {
      location: 'Seattle, WA',
      utm_source: 'x',
    });
    assert.notEqual(stableHash(base.query), stableHash(sorted.query));
    assert.equal(stableHash(base.query), stableHash(noise.query));
  });
});

describe('mapWithLimit', () => {
  test('runs every item, never more than the limit at once', async () => {
    const { mapWithLimit } = await import('../src/utilities/mapWithLimit');
    let running = 0;
    let peak = 0;
    const done: number[] = [];
    await mapWithLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      done.push(n);
      running--;
    });
    assert.equal(peak, 3);
    assert.deepEqual([...done].sort(), [1, 2, 3, 4, 5, 6, 7]);
  });

  test('an empty list is a no-op', async () => {
    const { mapWithLimit } = await import('../src/utilities/mapWithLimit');
    await mapWithLimit([], 4, async () => assert.fail('not called'));
  });
});
