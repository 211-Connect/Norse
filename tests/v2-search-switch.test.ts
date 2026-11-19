import assert from 'node:assert/strict';
import { test } from 'node:test';

import { searchPolicy } from '../src/app/(app)/features/search/resolver/policy';
import { deriveQueryType } from '../src/app/(app)/shared/lib/search-utils';
import { buildHybridSearchConfigCache } from '../src/payload/collections/HybridSearchConfig/utilities/buildHybridSearchConfigCache';
import {
  getV2PairingError,
  V2_ENGINE_NEEDS_FLAG_MESSAGE,
  V2_FLAG_OFF_WHILE_ENGINE_MESSAGE,
} from '../src/payload/collections/ResourceDirectories/hooks/validateV2SearchPairing';

const engine = (searchEngine: string) => ({
  search: { searchSettings: { searchEngine } },
});
const flag = (enableV2Api: boolean) => ({ featureFlags: { enableV2Api } });

test('v2 engine without the flag is refused', () => {
  assert.equal(
    getV2PairingError({ ...engine('v2'), ...flag(false) }),
    V2_ENGINE_NEEDS_FLAG_MESSAGE,
  );
  assert.equal(getV2PairingError(engine('v2')), V2_ENGINE_NEEDS_FLAG_MESSAGE);
});

test('v2 engine with the flag is accepted', () => {
  assert.equal(getV2PairingError({ ...engine('v2'), ...flag(true) }), null);
});

test('turning the flag off while the engine is v2 is refused', () => {
  const original = { ...engine('v2'), ...flag(true) };
  assert.equal(
    getV2PairingError(flag(false), original),
    V2_FLAG_OFF_WHILE_ENGINE_MESSAGE,
  );
});

test('partial update setting the engine to v2 uses the stored flag', () => {
  assert.equal(getV2PairingError(engine('v2'), flag(true)), null);
  assert.equal(
    getV2PairingError(engine('v2'), flag(false)),
    V2_ENGINE_NEEDS_FLAG_MESSAGE,
  );
});

test('other engines are unaffected by the flag', () => {
  for (const e of ['classic', 'hybrid', 'ai_classification']) {
    assert.equal(getV2PairingError({ ...engine(e), ...flag(false) }), null);
    assert.equal(getV2PairingError({ ...engine(e), ...flag(true) }), null);
  }
});

test('buildHybridSearchConfigCache carries enable_v2_api', () => {
  const build = (featureFlags: unknown) =>
    buildHybridSearchConfigCache('t1', {
      featureFlags,
    } as never);
  assert.equal(build({ enableV2Api: true })?.enable_v2_api, true);
  assert.equal(build({ enableV2Api: false })?.enable_v2_api, false);
  assert.equal(build({})?.enable_v2_api, false);
  assert.equal(build(undefined)?.enable_v2_api, false);
});

test("deriveQueryType treats 'v2' like 'ai_classification'", () => {
  const args = { originQueryType: undefined, query: 'food' };
  assert.equal(
    deriveQueryType({ ...args, searchEngine: 'v2' }),
    deriveQueryType({ ...args, searchEngine: 'ai_classification' }),
  );
});

test("searchPolicy treats 'v2' like 'ai_classification'", () => {
  for (const requireUserLocation of [true, false]) {
    assert.deepEqual(
      searchPolicy({ searchEngine: 'v2', requireUserLocation }),
      searchPolicy({ searchEngine: 'ai_classification', requireUserLocation }),
    );
  }
  assert.equal(
    searchPolicy({ searchEngine: 'v2', requireUserLocation: false }).needs,
    'gate',
  );
});

test('enableV2Api can be set by super-admin only', async () => {
  const { featureFlags } =
    await import('../src/payload/collections/ResourceDirectories/tabs/featureFlags');
  const field = (
    featureFlags as { fields: Array<Record<string, any>> }
  ).fields.find((f) => f.name === 'enableV2Api');
  assert.ok(field, 'enableV2Api field exists');
  const as = (roles: string[]) => ({ req: { user: { roles } } }) as never;
  for (const op of ['create', 'update'] as const) {
    const access = field.access[op];
    assert.equal(access(as(['super-admin'])), true);
    assert.equal(access(as(['tenant'])), false, `tenant ${op}`);
    assert.equal(access(as(['support'])), false, `support ${op}`);
    assert.equal(access({ req: { user: null } } as never), false);
  }
});
