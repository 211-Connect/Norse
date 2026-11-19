import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildHybridSearchConfigCache } from '../src/payload/collections/HybridSearchConfig/utilities/buildHybridSearchConfigCache';
import { search } from '../src/payload/collections/ResourceDirectories/tabs/search';
import { getV2SettingsError } from '../src/payload/collections/ResourceDirectories/hooks/validateV2EngineSettings';

type Settings = Record<string, unknown>;

const build = (searchSettings: Settings) =>
  buildHybridSearchConfigCache('t1', {
    search: { searchSettings },
    featureFlags: { enableV2Api: true },
  } as never);

const WEIGHT_KEYS = [
  'vector_score_weight',
  'base_taxonomy_boost',
  'geo_gauss_weight',
  'geo_default_scale_mi',
  'pinned_score_boost',
  'priority_score_weight',
  'bm25_name_boost',
  'bm25_service_name_boost',
  'bm25_org_name_boost',
  'bm25_taxonomy_use_ref_boost',
  'taxonomy_k',
  'taxonomy_num_candidates',
];

test('cache has none of the 12 weight keys', () => {
  const cache = build({ searchEngine: 'v2' }) as Record<string, unknown>;
  for (const key of WEIGHT_KEYS) assert.equal(key in cache, false, key);
});

test('cache carries search_engine, classic when missing', () => {
  for (const e of ['classic', 'hybrid', 'ai_classification', 'v2']) {
    assert.equal(build({ searchEngine: e })?.search_engine, e);
  }
  assert.equal(build({})?.search_engine, 'classic');
  assert.equal(build({ searchEngine: null })?.search_engine, 'classic');
});

test('cache returns null without a resource directory', () => {
  assert.equal(buildHybridSearchConfigCache('t1', null), null);
});

test('v2: v2UsePinnedResources maps to boost or ignore', () => {
  const on = build({ searchEngine: 'v2', v2UsePinnedResources: true });
  const off = build({ searchEngine: 'v2', v2UsePinnedResources: false });
  assert.equal(on?.pinned_resources_mode, 'boost');
  assert.equal(on?.v2_use_pinned_resources, true);
  assert.equal(off?.pinned_resources_mode, 'ignore');
  assert.equal(off?.v2_use_pinned_resources, false);
});

test('v2: stored pinned mode "top" does not leak', () => {
  const cache = build({
    searchEngine: 'v2',
    pinnedResourcesMode: 'top',
    v2UsePinnedResources: true,
  });
  assert.equal(cache?.pinned_resources_mode, 'boost');
});

test('v2: missing v2UsePinnedResources defaults to true / boost', () => {
  const cache = build({ searchEngine: 'v2', pinnedResourcesMode: 'ignore' });
  assert.equal(cache?.v2_use_pinned_resources, true);
  assert.equal(cache?.pinned_resources_mode, 'boost');
});

test('v2: stored unlocated "none" is pushed as "virtual"', () => {
  const cache = build({ searchEngine: 'v2', unlocatedInAreaSearch: 'none' });
  assert.equal(cache?.unlocated_in_area_search, 'virtual');
});

test('non-v2: stored top and none are pushed as stored', () => {
  for (const e of ['classic', 'hybrid', 'ai_classification']) {
    const cache = build({
      searchEngine: e,
      pinnedResourcesMode: 'top',
      unlocatedInAreaSearch: 'none',
    });
    assert.equal(cache?.pinned_resources_mode, 'top', e);
    assert.equal(cache?.unlocated_in_area_search, 'none', e);
  }
  const empty = build({ searchEngine: 'classic' });
  assert.equal(empty?.pinned_resources_mode, 'boost');
  assert.equal(empty?.unlocated_in_area_search, 'virtual');
});

test('cache carries enable_v2_api', () => {
  const b = (featureFlags: unknown) =>
    buildHybridSearchConfigCache('t1', { featureFlags } as never);
  assert.equal(b({ enableV2Api: true })?.enable_v2_api, true);
  assert.equal(b({})?.enable_v2_api, false);
});

// ---- admin conditions ----
type Field = {
  name?: string;
  fields?: Field[];
  admin?: { condition?: (d: unknown, s: unknown) => boolean };
  label?: unknown;
  description?: unknown;
};
const settingsFields = (
  (search.fields as Field[]).find((f) => f.name === 'searchSettings')
    ?.fields as Field[]
).reduce<Record<string, Field>>((acc, f) => {
  if (f.name) acc[f.name] = f;
  return acc;
}, {});

test('admin conditions follow the engine', () => {
  const show = (name: string, e: string) =>
    settingsFields[name]?.admin?.condition?.({}, { searchEngine: e });
  for (const e of ['classic', 'hybrid', 'ai_classification']) {
    assert.equal(show('pinnedResourcesMode', e), true, e);
    assert.equal(show('unlocatedInAreaSearch', e), true, e);
    assert.equal(show('v2UsePinnedResources', e), false, e);
  }
  assert.equal(show('pinnedResourcesMode', 'v2'), false);
  assert.equal(show('unlocatedInAreaSearch', 'v2'), false);
  assert.equal(show('v2UsePinnedResources', 'v2'), true);
});

test('v2UsePinnedResources is a checkbox defaulting to true', () => {
  const f = settingsFields.v2UsePinnedResources as Field & {
    type?: string;
    defaultValue?: unknown;
  };
  assert.equal(f.type, 'checkbox');
  assert.equal(f.defaultValue, true);
});

test('radius fields are labelled as address search, with no condition', () => {
  assert.equal(
    settingsFields.radiusSelectValues.label,
    'Address search: radius options',
  );
  assert.equal(
    settingsFields.defaultRadius.label,
    'Address search: default radius',
  );
  assert.equal(settingsFields.radiusSelectValues.admin?.condition, undefined);
  assert.equal(settingsFields.defaultRadius.admin?.condition, undefined);
});

// ---- guard ----
const ss = (searchSettings: Settings | undefined) =>
  searchSettings === undefined ? {} : { search: { searchSettings } };

test('guard: v2 engine, hidden field changed -> error', () => {
  const err = getV2SettingsError(
    ss({ pinnedResourcesMode: 'top' }),
    ss({ searchEngine: 'v2', pinnedResourcesMode: 'boost' }),
  );
  assert.equal(err?.path, 'search.searchSettings.pinnedResourcesMode');
  assert.match(err?.message ?? '', /does not apply to the v2 search engine/);
  const err2 = getV2SettingsError(
    ss({ searchEngine: 'v2', unlocatedInAreaSearch: 'none' }),
    ss({ searchEngine: 'classic' }),
  );
  assert.equal(err2?.path, 'search.searchSettings.unlocatedInAreaSearch');
});

test('guard: v2 engine, hidden field unchanged -> ok', () => {
  assert.equal(
    getV2SettingsError(
      ss({ pinnedResourcesMode: 'boost', unlocatedInAreaSearch: 'virtual' }),
      ss({ searchEngine: 'v2' }),
    ),
    null,
  );
  assert.equal(
    getV2SettingsError(
      ss({ searchEngine: 'v2', pinnedResourcesMode: 'top' }),
      ss({ searchEngine: 'v2', pinnedResourcesMode: 'top' }),
    ),
    null,
  );
});

test('guard: null vs default counts as unchanged', () => {
  assert.equal(
    getV2SettingsError(
      ss({ pinnedResourcesMode: null, unlocatedInAreaSearch: 'virtual' }),
      ss({ searchEngine: 'v2' }),
    ),
    null,
  );
  assert.equal(
    getV2SettingsError(
      ss({ searchEngine: 'v2', pinnedResourcesMode: 'boost' }),
      undefined,
    ),
    null,
  );
});

test('guard: non-v2 engine, v2UsePinnedResources changed -> error', () => {
  const err = getV2SettingsError(
    ss({ v2UsePinnedResources: false }),
    ss({ searchEngine: 'hybrid', v2UsePinnedResources: true }),
  );
  assert.equal(err?.path, 'search.searchSettings.v2UsePinnedResources');
  assert.match(err?.message ?? '', /Pick "v2 search" first/);
});

test('guard: non-v2 engine, v2UsePinnedResources unchanged or default -> ok', () => {
  assert.equal(
    getV2SettingsError(
      ss({ v2UsePinnedResources: true }),
      ss({ searchEngine: 'classic' }),
    ),
    null,
  );
  assert.equal(
    getV2SettingsError(
      ss({ searchEngine: 'classic', v2UsePinnedResources: null }),
      ss({ searchEngine: 'classic', v2UsePinnedResources: true }),
    ),
    null,
  );
});

test('guard: switching engine to v2 and setting v2 field together is ok', () => {
  assert.equal(
    getV2SettingsError(
      ss({ searchEngine: 'v2', v2UsePinnedResources: false }),
      ss({ searchEngine: 'classic' }),
    ),
    null,
  );
});

test('guard: partial update without searchSettings -> ok', () => {
  assert.equal(getV2SettingsError({}, ss({ searchEngine: 'v2' })), null);
  assert.equal(getV2SettingsError(undefined, undefined), null);
});

test('guard: create with no original doc uses the incoming engine', () => {
  const err = getV2SettingsError(
    ss({ searchEngine: 'v2', unlocatedInAreaSearch: 'all' }),
    undefined,
  );
  assert.equal(err?.path, 'search.searchSettings.unlocatedInAreaSearch');
  assert.equal(
    getV2SettingsError(
      ss({ searchEngine: 'classic', v2UsePinnedResources: false }),
      undefined,
    )?.path,
    'search.searchSettings.v2UsePinnedResources',
  );
});
