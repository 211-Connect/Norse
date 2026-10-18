// Cut-over scaffolding (ISS-2374): deleted by ISS-2377.
//
// The serializer over every lift input (corpus, fixtures, and every URL the writers and the legacy gate
// produced in the recorded snapshots):
// - lossless: lifting what it writes gives back the same lift, except for the one listed loss;
// - the writer rules are idempotent: a URL a writer wrote is written the same way again;
// - buildSearchUrl, now a wrapper over the serializer, writes exactly what it wrote before, compared
//   against a frozen copy over a grid of arguments built from every input.
// The writer-grid and gate snapshots (dialog-submit, dialog-route, server-page, server-page-writer-output)
// prove the same on the recorded paths.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyWriterRules,
  liftQueryString,
  serializeSearch,
  toFindResourcesQuery,
  type LiftedSearch,
  type Slot,
} from '../../../src/app/(app)/features/search/intent';
import {
  buildSearchUrl,
  type BuildSearchUrlArgs,
} from '../../../src/app/(app)/features/search/utils/buildSearchUrl';
import type { AiPredictOption } from '../../../src/app/(app)/shared/services/ai-classification-search-service';
import type { SearchEngine } from '../../../src/types/appConfig';
import { legacyBuildSearchUrl } from './legacy-build-search-url';
import { liftInputs } from './inputs';
import { stable } from './snapshots';

/**
 * Inputs the serializer cannot write back losslessly, each listed on ISS-2374. The filters slot holds what
 * qs parsed, and qs reads this unbalanced bracket as a key it cannot write again (revisit with ISS-2376).
 */
const KNOWN_LOSSES = new Set([
  'query_type=text&filters%5Bpayment%5D%5B0%5D%5BElderly%20Waiver%20%28EW%29&page=343',
]);

const ENGINES: SearchEngine[] = ['classic', 'hybrid', 'ai_classification'];

const comparable = (lifted: LiftedSearch) => stable(lifted);

test('lift(serialize(lift(url))) equals lift(url) for every input but the listed losses', () => {
  const inputs = liftInputs();
  assert.ok(inputs.size > 30000, `only ${inputs.size} inputs`);
  const failures: string[] = [];
  for (const [query, from] of inputs) {
    const lifted = liftQueryString(query);
    const again = liftQueryString(
      serializeSearch(lifted.intent, lifted.envelope),
    );
    if (comparable(again) !== comparable(lifted)) failures.push(query);
    else if (KNOWN_LOSSES.has(query))
      failures.push(`listed loss now round-trips: ${from}`);
  }
  // Exactly the listed losses: a new loss fails, and so does a listed one that stops being lost.
  assert.deepStrictEqual(failures.sort(), [...KNOWN_LOSSES].sort());
});

test('the writer rules are idempotent on every input but the listed losses', () => {
  const inputs = liftInputs();
  const failures: string[] = [];
  for (const [query] of inputs) {
    if (KNOWN_LOSSES.has(query)) continue;
    const lifted = liftQueryString(query);
    for (const searchEngine of ENGINES) {
      const once = applyWriterRules(lifted.intent, lifted.envelope, {
        searchEngine,
      });
      const first = serializeSearch(once.intent, once.envelope);
      const relifted = liftQueryString(first);
      const twice = applyWriterRules(relifted.intent, relifted.envelope, {
        searchEngine,
      });
      const second = serializeSearch(twice.intent, twice.envelope);
      if (first !== second)
        failures.push(`${searchEngine} ${query} -> ${first} -> ${second}`);
    }
  }
  assert.deepStrictEqual(failures.slice(0, 5), []);
});

const CLARIFY_OPTIONS: AiPredictOption[] = [
  {
    code: ' BD-1800.2000 ',
    pre_selected: true,
    results_count: 12,
    score: 0.91,
  },
  {
    code: 'BH-1800.8500',
    pre_selected: false,
    results_count: null,
    score: 0.62,
  },
];

/** What buildSearchUrl returned or threw, comparably. */
function outcome(
  build: (args: BuildSearchUrlArgs) => string,
  args: BuildSearchUrlArgs,
): string {
  try {
    return `url ${build(args)}`;
  } catch (e) {
    return `threw ${(e as Error).name}: ${(e as Error).message}`;
  }
}

/** Argument sets for one input: as the gate passes it, and as the dialog hooks pass raw values. */
function argumentGrid(lifted: LiftedSearch): BuildSearchUrlArgs[] {
  const { intent } = lifted;
  const raw = <T>(slot: Slot<unknown>) =>
    (slot.stated ? slot.value : undefined) as T | undefined;
  const parsed = toFindResourcesQuery(intent);
  const fromParsed = {
    ...parsed,
    filters: parsed.filters as BuildSearchUrlArgs['filters'],
  };
  const fromRaw = {
    query: raw<string>(intent.query),
    queryLabel: raw<string>(intent.queryLabel),
    queryType: raw<string>(intent.queryType),
    organizationId: raw<string>(intent.organizationId),
    location: raw<string>(intent.location),
    coordinates: raw<number[]>(intent.coords),
    distance: raw<string>(intent.distance),
    filters: raw<Record<string, string[]>>(intent.filters),
    taxonomies: raw<string[]>(intent.taxonomy),
  };
  const grid: BuildSearchUrlArgs[] = [];
  for (const searchEngine of ENGINES) {
    for (const base of [fromParsed, fromRaw]) {
      grid.push(
        { ...base, searchEngine },
        {
          ...base,
          searchEngine,
          aiScenario: 'search_and_notify_low_info',
          taxonomies: [' BD-1800.2000, BH-1800 ', '', 'BD-1800.2000'],
          skipLegacyLinkCheck: true,
        },
        {
          ...base,
          searchEngine,
          aiScenario: 'search_and_notify_low_confidence',
          skipLegacyLinkCheck: true,
        },
        { ...base, searchEngine, aiScenario: 'search', taxonomies: [] },
        {
          ...base,
          searchEngine,
          clarifyScenario: 'clarify_multiple_labels',
          clarifyOptions: CLARIFY_OPTIONS,
          skipLegacyLinkCheck: true,
        },
        {
          ...base,
          searchEngine,
          distance: base.distance === undefined ? null : [base.distance, '5'],
          coordinates: base.coordinates?.slice(0, 1) ?? null,
        },
      );
    }
  }
  return grid;
}

test('buildSearchUrl writes exactly what it wrote before, for every input and argument shape', () => {
  const inputs = liftInputs();
  let compared = 0;
  let threw = 0;
  const failures: string[] = [];
  for (const [query, from] of inputs) {
    for (const args of argumentGrid(liftQueryString(query))) {
      const want = outcome(legacyBuildSearchUrl, args);
      const got = outcome(buildSearchUrl, args);
      compared++;
      if (want.startsWith('threw')) threw++;
      if (got !== want)
        failures.push(
          `${from}\n  args ${JSON.stringify(args)}\n  want ${want}\n  got  ${got}`,
        );
    }
  }
  // Filter shapes no corpus URL reaches but a messy URL can hand the gate: a value that is not a list (it
  // throws today), nested items (written as [object Object]), empty lists and an empty object.
  const messyFilters = [
    'syntheticfilter',
    { payment: 'syntheticvalue' },
    { payment: [{ synthetickey: 'syntheticvalue' }] },
    { payment: [], age_group: ['synthetic value'] },
    { 'disabilities_&_health_conditions': ['a+b', ''] },
    {},
  ] as unknown as Array<BuildSearchUrlArgs['filters']>;
  for (const filters of messyFilters)
    for (const searchEngine of ENGINES) {
      const args = { query: 'syntheticquery', filters, searchEngine };
      const want = outcome(legacyBuildSearchUrl, args);
      const got = outcome(buildSearchUrl, args);
      compared++;
      if (want.startsWith('threw')) threw++;
      if (got !== want)
        failures.push(
          `messy filters\n  args ${JSON.stringify(args)}\n  want ${want}\n  got  ${got}`,
        );
    }
  assert.ok(threw >= 6, `the throwing filter shapes threw only ${threw} times`);
  assert.ok(compared > 500000, `only ${compared} argument sets compared`);
  console.log(
    `buildSearchUrl: ${compared} argument sets compared, ${threw} threw in both`,
  );
  assert.equal(
    failures.length,
    0,
    `${failures.length} differ:\n${failures.slice(0, 5).join('\n')}`,
  );
});
