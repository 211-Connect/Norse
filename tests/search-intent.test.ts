// The search intent's permanent tests: one fixture per URL generation, the lift's rules, classification,
// and the guarantee that a slot added later lifts unstated from every older URL.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import ts from 'typescript';

import {
  applyWriterRules,
  encodeIntent,
  GENERATIONS,
  liftIntent,
  liftQueryString,
  matchGenerations,
  rawSearchParams,
  readEnvelope,
  SEARCH_SLOTS,
  serializeSearch,
  serializeSearchUrl,
  stringParam,
} from '../src/app/(app)/features/search/intent';
import type { SearchEngine } from '../src/types/appConfig';

import {
  ALL_FIXTURES,
  GENERATION_FIXTURES,
  intentWith,
  LOSSY_FIXTURES,
  RULE_FIXTURES,
  SHAPE_FIXTURES,
  UNSTATED,
  WRITER_FIXTURES,
} from './search-intent-fixtures';

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

for (const fixture of SHAPE_FIXTURES) {
  test(`preserved shape: ${fixture.name}`, () => {
    assert.deepStrictEqual(liftQueryString(fixture.query), {
      ...fixture.expected,
      intent: intentWith(fixture.expected.intent),
    });
  });
}

for (const fixture of LOSSY_FIXTURES) {
  test(`listed loss: ${fixture.name}`, () => {
    assert.deepStrictEqual(liftQueryString(fixture.query), {
      ...fixture.expected,
      intent: intentWith(fixture.expected.intent),
    });
  });
}

for (const fixture of ALL_FIXTURES) {
  test(`canonical URL: ${fixture.name}`, () => {
    const lifted = liftQueryString(fixture.query);
    assert.equal(
      serializeSearch(lifted.intent, lifted.envelope),
      fixture.canonical,
    );
    const again = liftQueryString(fixture.canonical);
    if (fixture.loses) assert.notDeepStrictEqual(again, lifted, fixture.loses);
    else assert.deepStrictEqual(again, lifted);
  });
}

for (const fixture of WRITER_FIXTURES) {
  test(`writer rule: ${fixture.name}`, () => {
    const lifted = liftQueryString(fixture.query);
    const written = applyWriterRules(lifted.intent, lifted.envelope, {
      searchEngine: fixture.searchEngine,
    });
    assert.equal(
      serializeSearchUrl(written.intent, written.envelope),
      fixture.written,
    );
  });
}

const ENGINES: SearchEngine[] = ['classic', 'hybrid', 'ai_classification'];

test('the writer rules are idempotent: a written URL is written the same way again', () => {
  const urls = [
    ...ALL_FIXTURES.filter((f) => !f.loses).map((f) => f.query),
    ...WRITER_FIXTURES.map((f) => f.query),
  ];
  for (const query of urls) {
    for (const searchEngine of ENGINES) {
      const write = (q: string) => {
        const lifted = liftQueryString(q);
        const w = applyWriterRules(lifted.intent, lifted.envelope, {
          searchEngine,
        });
        return serializeSearch(w.intent, w.envelope);
      };
      const once = write(query);
      assert.equal(write(once), once, `${searchEngine} ${query}`);
    }
  }
});

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

test('a slot added later writes nothing for any older URL', () => {
  for (const { name, query } of ALL_FIXTURES) {
    const intent = liftIntent(WITH_DUMMY_SLOT, rawSearchParams(query));
    const written = new Map(encodeIntent(WITH_DUMMY_SLOT, intent));
    assert.deepStrictEqual(written.get('syntheticDummy'), [], name);
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
  // Negative control: the same declaration with its decoder and encoder compiles, so the check can tell
  // them apart.
  assert.deepStrictEqual(
    typeErrors(
      `defineSlots({ urgency: { keys: ['urgency'], decode: () => 'high', encode: (v: string) => [['urgency', v]] } });`,
    ),
    [],
  );
  const noDecoder = typeErrors(
    `defineSlots({ urgency: { keys: ['urgency'], encode: (v: string) => [['urgency', v]] } });`,
  );
  assert.equal(noDecoder.length, 1, noDecoder.join('\n'));
  assert.match(noDecoder[0], /decode/);
  const noEncoder = typeErrors(
    `defineSlots({ urgency: { keys: ['urgency'], decode: () => 'high' } });`,
  );
  assert.equal(noEncoder.length, 1, noEncoder.join('\n'));
  assert.match(noEncoder[0], /encode/);
});
