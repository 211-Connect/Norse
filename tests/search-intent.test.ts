// The search intent's permanent tests: one fixture per URL generation, the lift's rules, classification,
// and the guarantee that a slot added later lifts unstated from every older URL.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import ts from 'typescript';

import {
  GENERATIONS,
  liftIntent,
  liftQueryString,
  matchGenerations,
  rawSearchParams,
  readEnvelope,
  SEARCH_SLOTS,
  stringParam,
  type Generation,
  type LiftedSearch,
  type SearchIntent,
} from '../src/app/(app)/features/search/intent';

const UNSTATED = { stated: false } as const;
const stated = <T>(value: T) => ({ stated: true, value }) as const;

/** The whole intent: the slots named here are stated, every other slot is unstated. */
function intentWith(slots: Partial<Record<keyof SearchIntent, unknown>>) {
  return Object.fromEntries(
    Object.keys(SEARCH_SLOTS).map((name) => [
      name,
      name in slots ? stated(slots[name as keyof SearchIntent]) : UNSTATED,
    ]),
  );
}

type Fixture = {
  name: string;
  query: string;
  expected: Omit<LiftedSearch, 'intent'> & {
    intent: Partial<Record<keyof SearchIntent, unknown>>;
  };
};

const COORDS = [-122.3, 47.6];

/**
 * One real URL per generation: the most-viewed corpus URL (ISS-2370, values made synthetic), or for
 * canonical AI and clarify, which Umami truncated, what the legacy gate writes.
 */
const GENERATION_FIXTURES: Record<Generation, Fixture> = {
  classic_text: {
    name: 'classic text with a located radius',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=0',
    expected: {
      generation: 'classic_text',
      modifiers: ['distance', 'coords'],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'text',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '0',
      },
      envelope: { passThrough: [] },
    },
  },
  taxonomy_card: {
    name: 'topic card with several codes, on page 2',
    query:
      'query=BH-3800.7200%2CBH-3800.7000%2CBH-3800.7250%2CFT-4500%2CBH-3700.8500%2CBH-3700.3200%2CBH-3900&query_label=syntheticlabel%20text&query_type=taxonomy&page=2',
    expected: {
      generation: 'taxonomy_card',
      modifiers: ['page'],
      intent: {
        // The codes stay one query string: taxonomy normalisation is the serializer's (ISS-2374).
        query:
          'BH-3800.7200,BH-3800.7000,BH-3800.7250,FT-4500,BH-3700.8500,BH-3700.3200,BH-3900',
        queryLabel: 'syntheticlabel text',
        queryType: 'taxonomy',
      },
      envelope: { page: '2', passThrough: [] },
    },
  },
  hybrid_no_taxonomy: {
    name: 'legacy hybrid link with no taxonomy',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25',
    expected: {
      generation: 'hybrid_no_taxonomy',
      modifiers: ['distance', 'coords'],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'hybrid',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '25',
      },
      envelope: { passThrough: [] },
    },
  },
  canonical_ai: {
    name: 'canonical AI link written by the legacy gate',
    query:
      'query=syntheticquery&query_type=hybrid&taxonomy=BD-1800.2000&sllc=1',
    expected: {
      generation: 'canonical_ai',
      modifiers: [],
      intent: {
        query: 'syntheticquery',
        queryType: 'hybrid',
        taxonomy: ['BD-1800.2000'],
      },
      envelope: { sllc: '1', passThrough: [] },
    },
  },
  ai_notify: {
    name: 'AI notify with a low-information alert',
    query:
      'query=syntheticquery&query_label=syntheticlabel&query_type=hybrid&a=low_info&location=syntheticplace+text%2C&coords=-122.3%2C47.6&sllc=1',
    expected: {
      generation: 'ai_notify',
      modifiers: ['coords'],
      intent: {
        query: 'syntheticquery',
        queryLabel: 'syntheticlabel',
        queryType: 'hybrid',
        location: 'syntheticplace text,',
        coords: COORDS,
      },
      envelope: { sllc: '1', a: 'low_info', passThrough: [] },
    },
  },
  clarify: {
    name: 'clarify with two v1 need options, one pre-selected',
    query:
      'query=syntheticquery+text&query_label=syntheticlabel+text&query_type=hybrid&ai_scenario=clarify_multiple_labels&ai_options%5B0%5D%5Bcode%5D=BD-1800.2000&ai_options%5B0%5D%5Bscore%5D=0.91&ai_options%5B0%5D%5Bpre_selected%5D=1&ai_options%5B0%5D%5Bresults_count%5D=12&ai_options%5B1%5D%5Bcode%5D=BH-1800.8500&ai_options%5B1%5D%5Bscore%5D=0.62&ai_options%5B1%5D%5Bpre_selected%5D=0&ai_options%5B1%5D%5Bresults_count%5D=3&sllc=1',
    expected: {
      generation: 'clarify',
      modifiers: [],
      intent: {
        query: 'syntheticquery text',
        queryLabel: 'syntheticlabel text',
        queryType: 'hybrid',
        aiScenario: 'clarify_multiple_labels',
        aiOptions: [
          {
            code: 'BD-1800.2000',
            pre_selected: true,
            results_count: 12,
            score: 0.91,
          },
          {
            code: 'BH-1800.8500',
            pre_selected: false,
            results_count: 3,
            score: 0.62,
          },
        ],
      },
      envelope: { sllc: '1', passThrough: [] },
    },
  },
  organization_link: {
    name: 'organization link with a label and a radius',
    query:
      'query_label=syntheticlabel+text&query_type=text&organization_id=89ac10c5-4d83-56ab-90db-586d3a8188ae&distance=20',
    expected: {
      generation: 'organization_link',
      modifiers: ['organization_id', 'distance'],
      intent: {
        queryLabel: 'syntheticlabel text',
        queryType: 'text',
        organizationId: '89ac10c5-4d83-56ab-90db-586d3a8188ae',
        distance: '20',
      },
      envelope: { passThrough: [] },
    },
  },
  no_query: {
    name: 'located browse with the retired entry marker',
    query:
      'query_type=text&location=syntheticplace+text%2C&coords=-122.3%2C47.6&distance=25&entry=search_card',
    expected: {
      generation: 'no_query',
      modifiers: ['distance', 'coords'],
      intent: {
        queryType: 'text',
        location: 'syntheticplace text,',
        coords: COORDS,
        distance: '25',
      },
      envelope: { entry: 'search_card', passThrough: [] },
    },
  },
};

/** The lift's rules, each on the smallest URL that shows it. */
const RULE_FIXTURES: Fixture[] = [
  {
    name: 'bare /search: every slot unstated',
    query: '',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: {},
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'empty and Everywhere are stated, not unknown',
    query: 'query=&location=Everywhere',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: { query: '', location: 'Everywhere' },
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'an unrecognised query_type is kept but read as classic text',
    query: 'query=syntheticquery+text&query_type=query&query_language=en',
    expected: {
      generation: 'classic_text',
      modifiers: [],
      intent: { query: 'syntheticquery text', queryType: 'query' },
      envelope: { passThrough: [['query_language', 'en']] },
    },
  },
  {
    name: 'taxonomy codes with no query and no AI query_type are no query',
    query: 'taxonomy=BD-1800.2000',
    expected: {
      generation: 'no_query',
      modifiers: [],
      intent: { taxonomy: ['BD-1800.2000'] },
      envelope: { passThrough: [] },
    },
  },
  {
    name: 'unrecognised parameters pass through in order, untouched',
    query: 'utm_source=synthetic&query=syntheticquery&hl=es&gad_source=1',
    expected: {
      generation: 'classic_text',
      modifiers: [],
      intent: { query: 'syntheticquery' },
      envelope: {
        passThrough: [
          ['utm_source', 'synthetic'],
          ['hl', 'es'],
          ['gad_source', '1'],
        ],
      },
    },
  },
];

const ALL_FIXTURES = [...Object.values(GENERATION_FIXTURES), ...RULE_FIXTURES];

for (const [generation, fixture] of Object.entries(GENERATION_FIXTURES)) {
  test(`generation ${generation}: ${fixture.name}`, () => {
    assert.equal(fixture.expected.generation, generation);
    const lifted = liftQueryString(fixture.query);
    assert.deepStrictEqual(lifted, {
      ...fixture.expected,
      intent: intentWith(fixture.expected.intent),
    });
  });
}

for (const fixture of RULE_FIXTURES) {
  test(`lift rule: ${fixture.name}`, () => {
    assert.deepStrictEqual(liftQueryString(fixture.query), {
      ...fixture.expected,
      intent: intentWith(fixture.expected.intent),
    });
  });
}

test('every generation has a fixture', () => {
  assert.deepStrictEqual(
    Object.keys(GENERATION_FIXTURES).sort(),
    [...GENERATIONS].sort(),
  );
});

test('every fixture is classified into exactly one generation', () => {
  for (const { name, query } of ALL_FIXTURES) {
    const raw = rawSearchParams(query);
    const intent = liftIntent(SEARCH_SLOTS, raw);
    const matches = matchGenerations(intent, readEnvelope(raw, new Set()));
    assert.equal(matches.length, 1, `${name}: ${matches.join(', ') || 'none'}`);
  }
});

/** A slot added after every fixture URL was written, declared like any other. */
const WITH_DUMMY_SLOT = {
  ...SEARCH_SLOTS,
  syntheticDummy: stringParam('synthetic_dummy_slot'),
};

test('a slot added later lifts unstated from every older URL', () => {
  for (const { name, query } of ALL_FIXTURES) {
    const intent = liftIntent(WITH_DUMMY_SLOT, rawSearchParams(query));
    assert.deepStrictEqual(intent.syntheticDummy, UNSTATED, name);
  }
});

test('the lift is pure: the same URL lifts the same way twice', () => {
  for (const { query } of ALL_FIXTURES) {
    assert.deepStrictEqual(liftQueryString(query), liftQueryString(query));
  }
});

/** Type-checks `body` against the real slot module; returns the diagnostics. */
function typeErrors(body: string): string[] {
  const file = join(import.meta.dirname, '__slot-declaration-check.ts');
  const slotModule = join(
    import.meta.dirname,
    '../src/app/(app)/features/search/intent/slot',
  );
  const source = `import { defineSlots } from ${JSON.stringify(slotModule)};\n${body}\n`;
  const options: ts.CompilerOptions = {
    noEmit: true,
    strictNullChecks: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
  };
  const host = ts.createCompilerHost(options);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...rest) =>
    name === file
      ? ts.createSourceFile(name, source, ts.ScriptTarget.ES2017)
      : read(name, ...rest);
  const program = ts.createProgram([file], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

test('a slot declared without its URL encoding is a type error', () => {
  // Negative control: the same declaration with its decoder compiles, so the check can tell them apart.
  assert.deepStrictEqual(
    typeErrors(
      `defineSlots({ urgency: { keys: ['urgency'], decode: () => 'high' } });`,
    ),
    [],
  );
  const errors = typeErrors(`defineSlots({ urgency: { keys: ['urgency'] } });`);
  assert.equal(errors.length, 1, errors.join('\n'));
  assert.match(errors[0], /decode/);
});
