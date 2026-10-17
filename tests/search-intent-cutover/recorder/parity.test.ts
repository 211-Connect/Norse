// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Zero drift: every scenario in corpus/ through every harness, under every profile, compared with the
// snapshots recorded from today's code. RECORD=1 rewrites the snapshots (only ever on the baseline).
//
//   node --import tsx --experimental-test-module-mocks --test tests/search-intent-cutover/recorder/parity.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installEdges } from './edges';

installEdges();
const { HARNESSES } = await import('./harnesses');
const { compare, loadCorpus, readSnapshot, RECORDING, writeSnapshot } =
  await import('./snapshots');

const corpus = loadCorpus();
assert.ok(corpus.length > 0, 'corpus is empty: nothing would be compared');

for (const h of HARNESSES) {
  test(`parity: ${h.id} (BUILDERS ${h.paths.join(', ')})`, async () => {
    const rows: Array<{ case: string; output: unknown }> = [];
    for await (const r of h.cases(corpus)) rows.push(r);
    assert.ok(rows.length > 0, `${h.id} produced no cases`);

    if (RECORDING) {
      writeSnapshot(h.id, rows);
      return;
    }
    const expected = readSnapshot(h.id);
    assert.ok(
      expected,
      `no snapshot for ${h.id}: record the baseline first (RECORD=1 on development)`,
    );
    const diff = compare(expected, rows);
    const show = diff.changed
      .slice(0, 5)
      .map(
        (c) =>
          `\n  ${c.case}\n    expected ${c.expected.slice(0, 400)}\n    actual   ${c.actual.slice(0, 400)}`,
      )
      .join('');
    assert.ok(
      diff.changed.length === 0 &&
        diff.missing.length === 0 &&
        diff.extra.length === 0,
      `${h.id}: ${rows.length} cases, ${diff.changed.length} changed, ${diff.missing.length} with no snapshot, ` +
        `${diff.extra.length} snapshots with no case${show}` +
        (diff.missing.length
          ? `\n  first missing: ${diff.missing.slice(0, 3).join(', ')}`
          : '') +
        (diff.extra.length
          ? `\n  first extra: ${diff.extra.slice(0, 3).join(', ')}`
          : ''),
    );
  });
}
