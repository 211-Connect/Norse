import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getHybridSearchConfigKey } from '../src/payload/collections/HybridSearchConfig/utilities/getHybridSearchConfigKey';

const hybridKeyPrefix = (id: string) =>
  getHybridSearchConfigKey(id).split(':')[0];

async function load() {
  const { apiConfigCacheService } = await import('../src/cacheService');
  const mod =
    await import('../src/payload/collections/HybridSearchConfig/hooks/pushHybridSearchConfigToCache');
  return { apiConfigCacheService, mod };
}

/** Make only the hybrid-search key fail; any other cache write is a no-op. */
function stubSet(svc: { set: unknown; setOrThrow: unknown }, fail: boolean) {
  const original = { set: svc.set, setOrThrow: svc.setOrThrow };
  const writes: string[] = [];
  const write = async (key: string) => {
    writes.push(key);
    if (fail && key.startsWith(hybridKeyPrefix('t1')))
      throw new Error('redis down');
    return true;
  };
  svc.set = write;
  svc.setOrThrow = write;
  return {
    writes,
    restore: () => Object.assign(svc, original),
  };
}

const rd = { id: 't1', tenant: 't1' } as never;

describe('pushHybridSearchConfigToCache result', () => {
  test('failed: set throws -> "failed", never throws', async () => {
    const { apiConfigCacheService, mod } = await load();
    const stub = stubSet(apiConfigCacheService as never, true);
    try {
      const req = { payload: {}, context: {} } as never;
      const result = await mod.pushHybridSearchConfigToCache('t1', req, {
        hybridSearchConfig: null,
        resourceDirectory: rd,
      });
      assert.equal(result, 'failed');
    } finally {
      stub.restore();
    }
  });

  test('skipped: Redis disabled (no CACHE_REDIS_URI, real service) -> "skipped", not "pushed"', async () => {
    const { mod } = await load();
    assert.equal(process.env.CACHE_REDIS_URI, undefined);
    const req = { payload: {}, context: {} } as never;
    const result = await mod.pushHybridSearchConfigToCache('t1', req, {
      hybridSearchConfig: null,
      resourceDirectory: rd,
    });
    assert.equal(result, 'skipped');
  });

  // The real apiConfigCacheService, with Redis enabled and a given client.
  const pushWithRealService = async (state: object) => {
    const { apiConfigCacheService, mod } = await load();
    const svc = apiConfigCacheService as unknown as Record<string, unknown>;
    const saved = {
      isEnabled: svc.isEnabled,
      client: svc.client,
      lastConnectFailureAt: svc.lastConnectFailureAt,
    };
    Object.assign(svc, { isEnabled: true }, state);
    try {
      return await mod.pushHybridSearchConfigToCache(
        't1',
        { payload: {}, context: {} } as never,
        { hybridSearchConfig: null, resourceDirectory: rd },
      );
    } finally {
      Object.assign(svc, saved);
    }
  };

  test('failed: a Redis command error (real service) -> "failed"', async () => {
    const result = await pushWithRealService({
      client: {
        status: 'ready',
        set: async () => {
          throw new Error('redis down');
        },
      },
    });
    assert.equal(result, 'failed');
  });

  test('failed: Redis enabled but in the connect cooldown -> "failed", not "skipped"', async () => {
    const result = await pushWithRealService({
      client: null,
      lastConnectFailureAt: Date.now(),
    });
    assert.equal(result, 'failed');
  });

  test('pushed: the real service wrote the key -> "pushed"', async () => {
    const keys: string[] = [];
    const result = await pushWithRealService({
      client: { status: 'ready', set: async (key: string) => keys.push(key) },
    });
    assert.equal(result, 'pushed');
    assert.deepEqual(keys, [getHybridSearchConfigKey('t1')]);
  });

  test('pushed: set succeeds -> "pushed"', async () => {
    const { apiConfigCacheService, mod } = await load();
    const stub = stubSet(apiConfigCacheService as never, false);
    try {
      const req = { payload: {}, context: {} } as never;
      const result = await mod.pushHybridSearchConfigToCache('t1', req, {
        hybridSearchConfig: null,
        resourceDirectory: rd,
      });
      assert.equal(result, 'pushed');
      assert.equal(stub.writes.length, 1);
    } finally {
      stub.restore();
    }
  });

  test('skipped: no resource directory -> "skipped", nothing written', async () => {
    const { apiConfigCacheService, mod } = await load();
    const stub = stubSet(apiConfigCacheService as never, false);
    try {
      const req = { payload: {}, context: {} } as never;
      const result = await mod.pushHybridSearchConfigToCache('t1', req, {
        hybridSearchConfig: null,
        resourceDirectory: null,
      });
      assert.equal(result, 'skipped');
      assert.equal(stub.writes.length, 0);
    } finally {
      stub.restore();
    }
  });
});

describe('afterChange hook', () => {
  test('a failed push never throws; the saved doc is returned', async () => {
    const { apiConfigCacheService, mod } = await load();
    const stub = stubSet(apiConfigCacheService as never, true);
    const doc = { id: 'h1', tenant: 't1' };
    const req = {
      payload: { find: async () => ({ docs: [{ id: 'rd1', tenant: 't1' }] }) },
    };
    try {
      const hook =
        mod.pushHybridSearchConfigToCacheAfterChangeHook as never as (
          a: unknown,
        ) => Promise<unknown>;
      assert.equal(await hook({ doc, req }), doc);
      assert.equal(stub.writes.length, 1);
    } finally {
      stub.restore();
    }
  });
});
