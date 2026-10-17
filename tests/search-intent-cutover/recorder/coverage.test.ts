// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Every path in BUILDERS.md must have a harness. A path with none fails here, so nothing can be skipped
// silently. A harness claiming a path BUILDERS.md does not list fails too.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { installEdges } from './edges';

installEdges();
const { HARNESSES } = await import('./harnesses');

const builders = readFileSync(
  join(import.meta.dirname, '..', 'BUILDERS.md'),
  'utf8',
);
const listed = [...builders.matchAll(/^\|\s*(\d+[a-d]?)\s*\|/gm)].map(
  (m) => m[1],
);

test('BUILDERS.md lists paths (the check can see its target)', () => {
  assert.ok(
    listed.length >= 26,
    `parsed only ${listed.length} paths from BUILDERS.md`,
  );
});

test('every BUILDERS.md path has a harness', () => {
  const covered = new Set(HARNESSES.flatMap((h) => h.paths));
  const missing = listed.filter((p) => !covered.has(p));
  assert.deepEqual(missing, [], `paths with no harness: ${missing.join(', ')}`);
});

test('no harness claims a path BUILDERS.md does not list', () => {
  const unknown = HARNESSES.flatMap((h) => h.paths).filter(
    (p) => !listed.includes(p),
  );
  assert.deepEqual(unknown, [], `unknown paths claimed: ${unknown.join(', ')}`);
});

test('every harness runs in exactly one parity test file', () => {
  const files = ['parity-server', 'parity-client', 'parity-dom'].map((f) =>
    readFileSync(join(import.meta.dirname, `${f}.test.ts`), 'utf8'),
  );
  const grouped = files.flatMap((src) =>
    [...(src.split('runParity(')[1] ?? '').matchAll(/'([a-z0-9-]+)'/g)].map(
      (m) => m[1],
    ),
  );
  for (const h of HARNESSES) {
    assert.equal(
      grouped.filter((g) => g === h.id).length,
      1,
      `harness ${h.id} must be in exactly one parity file`,
    );
  }
});
