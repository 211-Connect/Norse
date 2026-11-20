import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

/**
 * Does throwing from a collection afterChange hook roll back the save?
 * Proven against the installed Payload source: the update operation runs
 * afterChange hooks inside the try block whose catch calls killTransaction
 * (db rollback) and rethrows, and commit happens only after the hooks.
 */
describe('Payload afterChange throw semantics', () => {
  const dist = 'node_modules/payload/dist/collections/operations';
  const op = readFileSync(`${dist}/updateByID.js`, 'utf8');
  const upd = readFileSync(`${dist}/utilities/update.js`, 'utf8');

  test('afterChange hooks run before commit, inside the try', () => {
    assert.ok(upd.includes('hooks.afterChange'));
    const updateCall = op.indexOf('await updateDocument(');
    const commit = op.indexOf('await commitTransaction(req)');
    const tryAt = op.indexOf('try {');
    assert.ok(tryAt < updateCall && updateCall < commit);
  });

  test('catch rolls back the transaction and rethrows', () => {
    const catchAt = op.indexOf('} catch (error) {');
    const tail = op.slice(catchAt);
    assert.ok(tail.includes('await killTransaction(args.req)'));
    assert.ok(tail.includes('throw error'));
    assert.ok(catchAt > op.indexOf('await commitTransaction(req)'));
  });
});

describe('pushHybridSearchConfigToCache failure path', () => {
  test('returns false and does not throw when the cache set fails', async () => {
    const { apiConfigCacheService } = await import('../src/cacheService');
    const { pushHybridSearchConfigToCache } =
      await import('../src/payload/collections/HybridSearchConfig/hooks/pushHybridSearchConfigToCache');
    const original = apiConfigCacheService.set;
    apiConfigCacheService.set = async () => {
      throw new Error('redis down');
    };
    try {
      const req = { payload: {}, context: {} } as never;
      const ok = await pushHybridSearchConfigToCache('t1', req, {
        hybridSearchConfig: null,
        resourceDirectory: { id: 't1', tenant: 't1' } as never,
      });
      assert.equal(ok, false);
    } finally {
      apiConfigCacheService.set = original;
    }
  });
});
