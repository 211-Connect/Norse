import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildHybridSearchConfigCache } from '../src/payload/collections/HybridSearchConfig/utilities/buildHybridSearchConfigCache';

test('buildHybridSearchConfigCache carries enable_v2_api', () => {
  const build = (featureFlags: unknown) =>
    buildHybridSearchConfigCache('t1', null, {
      featureFlags,
    } as never);
  assert.equal(build({ enableV2Api: true })?.enable_v2_api, true);
  assert.equal(build({ enableV2Api: false })?.enable_v2_api, false);
  assert.equal(build({})?.enable_v2_api, false);
  assert.equal(build(undefined)?.enable_v2_api, false);
});

test('enableV2Api can be set by super-admin only', async () => {
  const { featureFlags } =
    await import('../src/payload/collections/ResourceDirectories/tabs/featureFlags');
  const field = (
    featureFlags as { fields: Array<Record<string, any>> }
  ).fields.find((f) => f.name === 'enableV2Api');
  assert.ok(field, 'enableV2Api field exists');
  assert.equal(field.defaultValue, false, 'default off');
  const as = (roles: string[]) => ({ req: { user: { roles } } }) as never;
  for (const op of ['create', 'update'] as const) {
    const access = field.access[op];
    assert.equal(access(as(['super-admin'])), true);
    assert.equal(access(as(['tenant'])), false, `tenant ${op}`);
    assert.equal(access(as(['support'])), false, `support ${op}`);
    assert.equal(access({ req: { user: null } } as never), false);
  }
});

test("the engine list has no 'v2' option; the flag alone turns v2 on", async () => {
  const { search } =
    await import('../src/payload/collections/ResourceDirectories/tabs/search');
  const text = JSON.stringify(search, (_k, v) =>
    typeof v === 'function' ? undefined : v,
  );
  assert.ok(text.includes('ai_classification'));
  assert.ok(!text.includes('"value":"v2"'));
});

test('buildHybridSearchConfigCache carries ai_classification; unset is on', () => {
  const build = (featureFlags: unknown) =>
    buildHybridSearchConfigCache('t1', null, { featureFlags } as never);
  assert.equal(build({ enableV2Ai: true })?.ai_classification, 'on');
  assert.equal(build({ enableV2Ai: false })?.ai_classification, 'off');
  assert.equal(build({})?.ai_classification, 'on');
  assert.equal(build(undefined)?.ai_classification, 'on');
});

test('enableV2Ai: default on, super-admin only, shown only when enableV2Api is on', async () => {
  const { featureFlags } =
    await import('../src/payload/collections/ResourceDirectories/tabs/featureFlags');
  const field = (
    featureFlags as { fields: Array<Record<string, any>> }
  ).fields.find((f) => f.name === 'enableV2Ai');
  assert.ok(field, 'enableV2Ai field exists');
  assert.equal(field.defaultValue, true, 'default on');
  assert.equal(field.label, 'v2 AI (classifier, questions, need boost)');
  assert.equal(field.admin.condition({}, { enableV2Api: true }), true);
  assert.equal(field.admin.condition({}, { enableV2Api: false }), false);
  assert.equal(field.admin.condition({}, {}), false);
  const as = (roles: string[]) => ({ req: { user: { roles } } }) as never;
  for (const op of ['create', 'update'] as const) {
    assert.equal(field.access[op](as(['super-admin'])), true);
    assert.equal(field.access[op](as(['tenant'])), false);
  }
});
