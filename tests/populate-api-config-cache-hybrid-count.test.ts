import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// The other pushers import the whole Payload config (circular). Stub them:
// only the hybrid search push is under test and stays real.
const STUBBED: Record<string, string> = {
  pushOrchestrationConfigToCache:
    'export const pushOrchestrationConfigToCache = async () => {};',
  pushFacetsToCache: 'export const pushFacetsToCache = async () => {};',
  pushSuggestionsToCache:
    'export const pushSuggestionsToCache = async () => {};',
  pushTopicsToCache: 'export const pushTopicsToCache = async () => {};',
  pushEnabledLocalesToCache:
    'export const pushEnabledLocalesToCache = async () => {};',
  pushRealmIdToCache: 'export const pushRealmIdToCache = async () => {};',
  pushAnalyticsConfig:
    'export const pushAnalyticsConfigToCache = async () => {};',
  roles: 'export const isSuperAdmin = () => true;',
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const last = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('../collections/') && last in STUBBED) {
      return {
        url: `data:text/javascript,${encodeURIComponent(STUBBED[last])}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

/**
 * The populate endpoint must count a hybrid search config push as
 * "triggered" only when it reached the cache. A failed push is counted in
 * `hybridSearchConfigFailed`, so an operator reading the response is not told
 * the cache is warm when it is not.
 */
async function callEndpoint(failHybrid: boolean) {
  const { apiConfigCacheService } = await import('../src/cacheService');
  const { populateApiConfigCache } =
    await import('../src/payload/endpoints/populateApiConfigCache');

  const svc = apiConfigCacheService as unknown as {
    set: (...a: unknown[]) => Promise<unknown>;
  };
  const original = svc.set;
  svc.set = async (key: unknown) => {
    if (failHybrid && String(key).startsWith('search_config:')) {
      throw new Error('redis down');
    }
  };

  const tenant = { id: 't1' };
  const resourceDirectory = { id: 'rd1', tenant: 't1' };
  const req = {
    user: { id: 'u1', roles: ['super-admin'] },
    payload: {
      find: async ({ collection }: { collection: string }) => ({
        docs:
          collection === 'tenants'
            ? [tenant]
            : collection === 'resource-directories'
              ? [resourceDirectory]
              : [],
        hasNextPage: false,
      }),
    },
  };

  try {
    const response = await (
      populateApiConfigCache.handler as unknown as (
        r: unknown,
      ) => Promise<Response>
    )(req);
    return { status: response.status, body: await response.json() };
  } finally {
    svc.set = original;
  }
}

test('a failed hybrid search push is counted as failed, not triggered', async () => {
  const { status, body } = await callEndpoint(true);
  assert.equal(status, 200, JSON.stringify(body));
  assert.equal(body.hybridSearchConfigTriggered, 0);
  assert.equal(body.hybridSearchConfigFailed, 1);
});

test('a good hybrid search push is counted as triggered', async () => {
  const { status, body } = await callEndpoint(false);
  assert.equal(status, 200, JSON.stringify(body));
  assert.equal(body.hybridSearchConfigTriggered, 1);
  assert.equal(body.hybridSearchConfigFailed, 0);
});
