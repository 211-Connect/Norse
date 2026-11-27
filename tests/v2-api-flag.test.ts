import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildHybridSearchConfigCache } from '../src/payload/collections/HybridSearchConfig/utilities/buildHybridSearchConfigCache';
import { featureFlags } from '../src/payload/collections/ResourceDirectories/tabs/featureFlags';

test('buildHybridSearchConfigCache writes enable_v2_api; unset is false', () => {
  const build = (flags: unknown) =>
    buildHybridSearchConfigCache('t1', null, {
      featureFlags: flags,
    } as never);
  assert.equal(build({ enableV2Api: true })?.enable_v2_api, true);
  assert.equal(build({ enableV2Api: false })?.enable_v2_api, false);
  assert.equal(build({ enableV2Api: null })?.enable_v2_api, false);
  assert.equal(build({})?.enable_v2_api, false);
  assert.equal(build(undefined)?.enable_v2_api, false);
});

test('enableV2Api: default off, super-admin only', () => {
  const field = (
    featureFlags as unknown as { fields: Array<Record<string, any>> }
  ).fields.find((f) => f.name === 'enableV2Api');
  assert.ok(field, 'enableV2Api field exists');
  assert.equal(field.defaultValue, false);
  const as = (roles: string[]) => ({ req: { user: { roles } } }) as never;
  for (const op of ['create', 'update'] as const) {
    assert.equal(field.access[op](as(['super-admin'])), true);
    assert.equal(field.access[op](as(['support'])), false, `support ${op}`);
    assert.equal(field.access[op](as(['tenant'])), false, `tenant ${op}`);
    assert.equal(field.access[op]({ req: { user: null } } as never), false);
  }
});
