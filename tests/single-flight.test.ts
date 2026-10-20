import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { createSingleFlight } from '../src/utilities/singleFlight';
import { clearMemoryCache, withCache } from '../src/utilities/withCache';

// Redis off: `cacheService` reads miss and writes no-op, so only the
// in-flight sharing and the memory cache are exercised.
delete process.env.CACHE_REDIS_URI;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('concurrent calls with one key run fn once', async () => {
  const run = createSingleFlight<string>(30_000);
  const gate = deferred<number>();
  let calls = 0;
  const fn = () => {
    calls += 1;
    return gate.promise;
  };

  const a = run('k', fn);
  const b = run('k', fn);
  gate.resolve(42);

  assert.deepEqual(await Promise.all([a.promise, b.promise]), [42, 42]);
  assert.equal(calls, 1);
  assert.equal(a.shared, false);
  assert.equal(b.shared, true);
  assert.equal(run.size(), 0);
});

test('different keys do not share', async () => {
  const run = createSingleFlight<string>(30_000);
  let calls = 0;
  const fn = async () => ++calls;

  await Promise.all([run('a', fn).promise, run('b', fn).promise]);
  assert.equal(calls, 2);
});

test('a rejection reaches waiting callers, then the key is cleared', async () => {
  const run = createSingleFlight<string>(30_000);
  const gate = deferred<number>();

  const a = run('k', () => gate.promise);
  const b = run('k', () => gate.promise);
  gate.reject(new Error('upstream down'));

  await assert.rejects(a.promise, /upstream down/);
  await assert.rejects(b.promise, /upstream down/);
  assert.equal(run.size(), 0);

  const retry = run('k', async () => 7);
  assert.equal(retry.shared, false);
  assert.equal(await retry.promise, 7);
});

test('a synchronous throw in fn becomes a rejection and clears the key', async () => {
  const run = createSingleFlight<string>(30_000);
  const a = run('k', () => {
    throw new Error('sync');
  });

  await assert.rejects(a.promise, /sync/);
  assert.equal(run.size(), 0);
});

test('an entry older than maxAgeMs is not joined', async (t) => {
  mock.timers.enable({ apis: ['Date'], now: 0 });
  t.after(() => mock.timers.reset());

  const run = createSingleFlight<string>(1_000);
  const hung = deferred<string>();
  const fresh = deferred<string>();

  const a = run('k', () => hung.promise);
  mock.timers.tick(1_000);
  const b = run('k', () => fresh.promise);
  assert.equal(b.shared, false);

  // The stale call settling must not remove the newer entry.
  hung.resolve('stale');
  await a.promise;
  assert.equal(run('k', () => fresh.promise).shared, true);

  fresh.resolve('fresh');
  assert.equal(await b.promise, 'fresh');
});

test('withCache: concurrent misses fetch once, joiners get their own copy', async () => {
  clearMemoryCache();
  const gate = deferred<{ items: number[] }>();
  let calls = 0;
  const fetchFn = () => {
    calls += 1;
    return gate.promise;
  };
  const config = { redis: false, memory: false };

  const first = withCache('search_config:t1:en', fetchFn, config);
  const second = withCache('search_config:t1:en', fetchFn, config);
  gate.resolve({ items: [1, 2] });
  const [a, b] = await Promise.all([first, second]);

  assert.equal(calls, 1);
  assert.deepEqual(a, { items: [1, 2] });
  assert.deepEqual(b, { items: [1, 2] });
  assert.notEqual(a, b);
  a.items.push(3);
  assert.deepEqual(b.items, [1, 2]);
});

test('withCache: shares a value that shouldCache rejects, without caching it', async () => {
  clearMemoryCache();
  const gate = deferred<string[]>();
  let calls = 0;
  const fetchFn = () => {
    calls += 1;
    return gate.promise;
  };
  const config = { redis: false, memory: true };
  const neverCache = () => false;

  const first = withCache('search_config:t2:en', fetchFn, config, neverCache);
  const second = withCache('search_config:t2:en', fetchFn, config, neverCache);
  gate.resolve([]);

  assert.deepEqual(await Promise.all([first, second]), [[], []]);
  assert.equal(calls, 1);

  // Not written to the memory cache, so the next call fetches.
  const next = await withCache(
    'search_config:t2:en',
    async () => {
      calls += 1;
      return ['next'];
    },
    config,
  );
  assert.deepEqual(next, ['next']);
  assert.equal(calls, 2);
});

test('withCache: shares null results', async () => {
  let calls = 0;
  const fetchFn = async () => {
    calls += 1;
    return null;
  };
  const config = { redis: false, memory: false };

  const results = await Promise.all([
    withCache('search_config:t3:en', fetchFn, config),
    withCache('search_config:t3:en', fetchFn, config),
  ]);

  assert.deepEqual(results, [null, null]);
  assert.equal(calls, 1);
});

test('withCache: after a fetch settles, the next miss fetches again', async () => {
  let calls = 0;
  const fetchFn = async () => ++calls;
  const config = { redis: false, memory: false };

  await withCache('search_config:t4:en', fetchFn, config);
  await withCache('search_config:t4:en', fetchFn, config);
  assert.equal(calls, 2);
});
