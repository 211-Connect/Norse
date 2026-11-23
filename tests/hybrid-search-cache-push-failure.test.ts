import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getHybridSearchConfigKey } from '../src/payload/collections/HybridSearchConfig/utilities/getHybridSearchConfigKey';

const hybridKeyPrefix = (id: string) =>
  getHybridSearchConfigKey(id).split(':')[0];

async function load() {
  const { apiConfigCacheService } = await import('../src/cacheService');
  const mod =
    await import('../src/payload/collections/HybridSearchConfig/hooks/pushHybridSearchConfigToCache');
  const rdHook =
    await import('../src/payload/collections/ResourceDirectories/hooks/pushHybridSearchConfigToCache');
  return { apiConfigCacheService, mod, rdHook };
}

/** Make only the hybrid-search key fail; any other cache write is a no-op. */
function stubSet(
  svc: { set: (...a: never[]) => Promise<unknown> },
  fail: boolean,
) {
  const original = svc.set;
  const writes: string[] = [];
  (svc as { set: unknown }).set = async (key: string) => {
    writes.push(key);
    if (fail && key.startsWith(hybridKeyPrefix('t1')))
      throw new Error('redis down');
  };
  return {
    writes,
    restore: () => ((svc as { set: unknown }).set = original),
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

describe('afterChange hooks mark req.context only on a failed push', () => {
  const run = async (fail: boolean, context: object | undefined) => {
    const { apiConfigCacheService, mod, rdHook } = await load();
    const stub = stubSet(apiConfigCacheService as never, fail);
    try {
      const req = {
        payload: { find: async () => ({ docs: [] }) },
        context,
      } as never as {
        context?: Record<string, unknown>;
      };
      // Resource directory hook, with the tenant read from the doc.
      await (
        rdHook.pushHybridSearchConfigToCacheFromResourceDirectory as never as (
          a: unknown,
        ) => Promise<unknown>
      )({ doc: { id: 't1', tenant: 't1' }, req });
      return req.context;
    } finally {
      stub.restore();
    }
  };
  const KEY = 'hybridSearchCachePushFailed';

  test('failure sets the flag', async () => {
    const ctx = await run(true, {});
    assert.equal(ctx?.[KEY], true);
  });

  test('success leaves the flag unset', async () => {
    const ctx = await run(false, {});
    assert.equal(ctx?.[KEY], undefined);
  });

  test('failure with no req.context does not throw', async () => {
    const ctx = await run(true, undefined);
    assert.equal(ctx?.[KEY], true);
  });
});

describe('HybridSearchConfig afterChange hook', () => {
  const KEY = 'hybridSearchCachePushFailed';
  const call = async (fail: boolean) => {
    const { apiConfigCacheService, mod } = await load();
    const stub = stubSet(apiConfigCacheService as never, fail);
    try {
      const req = {
        payload: {
          find: async () => ({ docs: [{ id: 'rd1', tenant: 't1' }] }),
        },
        context: {},
      };
      await (
        mod.pushHybridSearchConfigToCacheAfterChangeHook as never as (
          a: unknown,
        ) => Promise<unknown>
      )({ doc: { id: 'h1', tenant: 't1' }, req });
      return req.context as Record<string, unknown>;
    } finally {
      stub.restore();
    }
  };

  test('sets the flag only when the push fails', async () => {
    assert.equal((await call(true))[KEY], true);
    assert.equal((await call(false))[KEY], undefined);
  });
});
