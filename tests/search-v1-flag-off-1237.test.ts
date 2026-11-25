// Norse #1237: the four v1 differences found by the review, each pinned with the v2 switch off.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { areaSettingsForQuery } from '../src/app/(app)/features/search/utils/area-settings';
import { NoResultsCall } from '../src/app/(app)/features/search/components/no-results-call';
import { DialButton } from '../src/app/(app)/features/search/components/dial-button';
import { usesV2Results } from '../src/app/(app)/features/search/utils/uses-v2-results';
import { LocalizedLink } from '../src/app/(app)/shared/components/LocalizedLink';
import { listenerOptions } from '../src/app/(app)/shared/hooks/use-on-pointer-down-outside';

// A computed specifier: tsc does not resolve it, and the query string gives a fresh module per call.
const loadConfig = (tag: string) =>
  import(`../next.config.js?${tag}`) as Promise<{ default: unknown }>;

type El = { type: unknown; props: Record<string, unknown> };

test('no-results call link, v2 off: LocalizedLink with the raw number', () => {
  const el = NoResultsCall({
    number: '(206) 555-0100 x5',
    v2: false,
    children: 'x',
  }) as unknown as El;
  assert.equal(el.type, LocalizedLink);
  assert.equal(el.props.href, 'tel:(206) 555-0100 x5');
});

test('no-results call link, v2 on: the dial link', () => {
  const el = NoResultsCall({
    number: '206-555-0100',
    v2: true,
    children: 'x',
  }) as unknown as El;
  assert.equal(el.type, DialButton);
});

test('area settings, v2 off: raw Payload values go through, unknown ones too (as development)', () => {
  assert.deepEqual(
    areaSettingsForQuery(
      { areaMatch: 'bogus', unlocatedInAreaSearch: 'weird' },
      false,
    ),
    { areaMatch: 'bogus', unlocated: 'weird' },
  );
  assert.deepEqual(areaSettingsForQuery(undefined, false), {
    areaMatch: undefined,
    unlocated: undefined,
  });
});

test('area settings, v2 on: unknown values are dropped', () => {
  assert.deepEqual(
    areaSettingsForQuery(
      { areaMatch: 'bogus', unlocatedInAreaSearch: 'weird' },
      true,
    ),
    {},
  );
});

test('pointer listeners, v1 default: no options object (as development)', () => {
  assert.equal(listenerOptions(undefined), undefined);
  assert.deepEqual(listenerOptions(['pointerdown']), { passive: true });
});

test('next.config.js, NORSE_V2_PROTOTYPE unset: no dev-server options', async () => {
  const saved = [process.env.NORSE_V2_PROTOTYPE, process.env.TURBOPACK_ROOT];
  delete process.env.NORSE_V2_PROTOTYPE;
  process.env.TURBOPACK_ROOT = '/tmp';
  try {
    const config = (await loadConfig('off')).default as Record<string, unknown>;
    for (const key of ['devIndicators', 'allowedDevOrigins']) {
      assert.equal(key in config, false, key);
    }
    // withPayload may add its own turbopack settings; the prototype root must not be there.
    assert.notEqual(
      (config.turbopack as { root?: string } | undefined)?.root,
      '/tmp',
    );
    process.env.NORSE_V2_PROTOTYPE = '1';
    const on = (await loadConfig('on')).default as Record<string, unknown>;
    assert.equal(on.devIndicators, false);
  } finally {
    if (saved[0] === undefined) delete process.env.NORSE_V2_PROTOTYPE;
    else process.env.NORSE_V2_PROTOTYPE = saved[0];
    if (saved[1] === undefined) delete process.env.TURBOPACK_ROOT;
    else process.env.TURBOPACK_ROOT = saved[1];
  }
});

test('results list: the v2 list (and demo vocabulary) is reached only with the switch on', async () => {
  assert.equal(usesV2Results({ featureFlags: { enableV2Api: false } }), false);
  assert.equal(usesV2Results({ featureFlags: {} }), false);
  assert.equal(usesV2Results(undefined), false);
  assert.equal(usesV2Results({ featureFlags: { enableV2Api: true } }), true);
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(
    'src/app/(app)/features/search/components/render-results.tsx',
    'utf8',
  );
  assert.doesNotMatch(src, /sune-demo/);
  assert.match(src, /dynamic\(\(\) =>\s*import\('\.\/render-results-v2'\)/);
});
