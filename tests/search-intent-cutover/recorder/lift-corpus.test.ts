// Cut-over scaffolding (ISS-2373): deleted by ISS-2377.
//
// The lift over every corpus URL and every URL the writers and the legacy gate produced in the recorded
// snapshots. Mapped back onto the old shapes, it must equal the old parsers field by field (the replay in
// parity-lift.test.ts proves the same against observable behaviour; this also covers fields no recorded
// output reads). Every URL must classify into exactly one generation, and a slot added later must come
// through unstated. The permanent versions of the last two run on the fixtures in tests/search-intent.test.ts.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { parseLegacyAiClarifyParams } from '../../../src/app/(app)/features/search/utils/parseLegacyAiClarifyParams';
import { parseSearchParams } from '../../../src/app/(app)/features/search/utils/parseSearchParams';
import {
  liftIntent,
  liftSearchParams,
  matchGenerations,
  rawSearchParams,
  readEnvelope,
  SEARCH_SLOTS,
  stringParam,
  toFindResourcesQuery,
  toLegacyAiClarifyState,
} from '../../../src/app/(app)/features/search/intent';
import { loadCorpus, readSnapshot, ROOT } from './snapshots';

/** Every query string to lift, with where it came from. */
export function liftInputs(): Map<string, string> {
  const inputs = new Map<string, string>();
  for (const row of loadCorpus())
    inputs.set(row.query, `corpus ${row.scenario}`);
  const writers = readSnapshot('server-page-writer-output');
  const pages = readSnapshot('server-page');
  assert.ok(writers && pages, 'snapshots missing: nothing would be compared');
  for (const id of writers.keys()) {
    const url = id.slice(0, id.indexOf('|'));
    inputs.set(url.split('?')[1] ?? '', `writer ${url.slice(0, 80)}`);
  }
  for (const [id, output] of [...pages, ...writers]) {
    const redirect = (JSON.parse(output) as { redirect?: string }).redirect;
    if (redirect) inputs.set(redirect.split('?')[1] ?? '', `redirect ${id}`);
  }
  return inputs;
}

test('the lift mapped back equals parseSearchParams and parseLegacyAiClarifyParams', () => {
  const inputs = liftInputs();
  assert.ok(inputs.size > 9000, `only ${inputs.size} inputs`);
  const failures: string[] = [];
  for (const [query, from] of inputs) {
    const raw = rawSearchParams(query);
    const { intent } = liftSearchParams(raw);
    try {
      assert.deepStrictEqual(
        toFindResourcesQuery(intent),
        parseSearchParams(raw),
      );
      assert.deepStrictEqual(
        toLegacyAiClarifyState(intent),
        parseLegacyAiClarifyParams(raw),
      );
    } catch (e) {
      failures.push(`${from}: ${(e as Error).message.slice(0, 600)}`);
    }
  }
  assert.equal(
    failures.length,
    0,
    `${failures.length} of ${inputs.size} differ:\n${failures.slice(0, 5).join('\n')}`,
  );
});

test('every URL is classified into exactly one generation', () => {
  const inputs = liftInputs();
  const failures: string[] = [];
  for (const [query, from] of inputs) {
    const raw = rawSearchParams(query);
    const matches = matchGenerations(
      liftIntent(SEARCH_SLOTS, raw),
      readEnvelope(raw, new Set()),
    );
    if (matches.length !== 1)
      failures.push(`${from}: ${matches.join(', ') || 'none'}`);
  }
  assert.equal(
    failures.length,
    0,
    `${failures.length} of ${inputs.size}:\n${failures.slice(0, 5).join('\n')}`,
  );
});

/**
 * Why the corpus builder may read `query` or `query_type` differently from today's parser: it takes the
 * first value of a repeated or bracketed key and strips it; today's parser reads such a key as nothing and
 * compares values exactly. Null when the builder and the parser see the same value.
 */
function readDifferently(query: string): string | null {
  for (const [key, value] of Object.entries(rawSearchParams(query))) {
    const root = key.replace(/\[.*$/, '');
    if (root !== 'query' && root !== 'query_type') continue;
    if (key !== root) return `bracketed ${root}`;
    if (Array.isArray(value)) return `repeated ${root}`;
    if (value !== value?.trim()) return `edge whitespace in ${root}`;
  }
  return null;
}

// The corpus builder labelled every scenario with its own rules (tools/verify_corpus.py), written
// separately from the lift, so agreement is evidence and not the classifier checking itself. Its `other`
// bucket is an unrecognised query_type, which the lift reads as classic text (ISS-2373, 2026-10-18). Where
// they disagree, the URL must be one the two read differently on purpose, and the lift follows today.
test("the lift agrees with the corpus builder on every scenario's generation", () => {
  const unexplained: string[] = [];
  const explained = new Map<string, number>();
  for (const row of loadCorpus()) {
    const want = row.generation === 'other' ? 'classic_text' : row.generation;
    const got = liftSearchParams(rawSearchParams(row.query)).generation;
    if (got === want) continue;
    const why = readDifferently(row.query);
    if (!why) unexplained.push(`${row.scenario}: ${want} -> ${got}`);
    else {
      const k = `${want} -> ${got} (${why})`;
      explained.set(k, (explained.get(k) ?? 0) + 1);
    }
  }
  assert.deepStrictEqual(unexplained, []);
  console.log('read differently on purpose:', Object.fromEntries(explained));
});

test('a slot added later comes through unstated from every URL', () => {
  const WITH_DUMMY_SLOT = {
    ...SEARCH_SLOTS,
    syntheticDummy: stringParam('synthetic_dummy_slot'),
  };
  const inputs = liftInputs();
  for (const [query, from] of inputs) {
    const intent = liftIntent(WITH_DUMMY_SLOT, rawSearchParams(query));
    assert.deepStrictEqual(intent.syntheticDummy, { stated: false }, from);
  }
});

// ISS-2373 builds the lift beside the old parsers. ISS-2375 moves the page onto it and deletes this.
test('no production code calls the lift yet', () => {
  const src = join(ROOT, '../../src');
  const intentDir = join(src, 'app/(app)/features/search/intent');
  const callers: string[] = [];
  let scanned = 0;
  for (const entry of readdirSync(src, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    if (file.startsWith(intentDir)) continue;
    scanned++;
    if (
      /from\s+['"][^'"]*search\/intent(\/[^'"]*)?['"]|from\s+['"]\.\.?\/intent['"]/.test(
        readFileSync(file, 'utf8'),
      )
    )
      callers.push(relative(src, file));
  }
  assert.ok(scanned > 500, `only ${scanned} source files scanned`);
  assert.deepStrictEqual(callers, []);
});
