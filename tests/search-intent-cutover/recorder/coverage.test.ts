// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Every path in BUILDERS.md must have a harness. A path with none fails here, so nothing can be skipped
// silently. A harness claiming a path BUILDERS.md does not list fails too.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
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

// ---------------------------------------------------------------- a row's code must actually run

/** Paths BUILDERS.md names that no harness imports, each with the reason it is still a known gap. */
const NOT_EXERCISED: Record<string, string> = {
  'app/(app)/shared/components/header': `no harness renders the header (19); its search link is a CMS href passed verbatim through LocalizedLink, which cms-links exercises. The pass-through itself is unverified; the live runner (ISS-2372) sees it.`,
  'app/(app)/features/printable-directories/components/create-directory-wizard': `the wizard (16) turns a search into the stored parameters a directory source replays; the directories harness hands section-source-item stored parameters directly, so the wizard's own serialisation is not exercised. The live runner (ISS-2372) sees it.`,
  auth: `the after-login redirect (23) runs inside NextAuth; the proxy harness records the login-wall redirect that wraps the URL, not the unwrap.`,
};

/** Source files named in a row's "Where" cell, as paths under src/ without extension. */
function filesNamedBy(row: string): string[] {
  return [...row.matchAll(/`([^`]+\.tsx?)`/g)]
    .map((m) => m[1])
    .filter((f) => f.includes('/')) // a bare file name ("same, via `filters.tsx`") is not a path
    .map((f) => (f.startsWith('src/') ? f.slice(4) : `app/(app)/${f}`))
    .map((f) => f.replace(/\.tsx?$/, ''));
}

const SRC = join(import.meta.dirname, '..', '..', '..', 'src');

/** Modules edges.ts replaces with stubs: a path reached only through one of these is not exercised. */
function mocked(): Set<string> {
  const src = readFileSync(join(import.meta.dirname, 'edges.ts'), 'utf8');
  return new Set(
    [...src.matchAll(/mock\.module\('@\/([^']+)'/g)].map((m) => m[1]),
  );
}

/** A module path under src/ (no extension) to its file, or null when it is not a src module. */
function resolve(spec: string, fromDir: string): string | null {
  let p: string;
  if (spec.startsWith('@/')) p = spec.slice(2);
  else if (spec.startsWith('.')) p = relative(SRC, join(fromDir, spec));
  else return null; // a package
  if (p.startsWith('..')) return null; // outside src (the recorder itself)
  for (const candidate of [p, `${p}/index`]) {
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(join(SRC, candidate + ext))) return candidate;
    }
  }
  return null;
}

function importsOf(file: string): string[] {
  return [
    ...readFileSync(file, 'utf8').matchAll(
      /(?:import\(|from |import )'([^']+)'/g,
    ),
  ].map((m) => m[1]);
}

/**
 * Every src module some harness runs: what the recorder imports directly (edges.ts excluded: what it
 * names, it replaces), plus everything those modules import in turn, stopping at a mocked module.
 */
function exercised(): Set<string> {
  const stop = mocked();
  const queue: string[] = [];
  for (const name of readdirSync(import.meta.dirname)) {
    if (!name.endsWith('.ts') || name === 'edges.ts') continue;
    for (const spec of importsOf(join(import.meta.dirname, name))) {
      const p = resolve(
        spec.replace(/^\.\.\/\.\.\/\.\.\/src\//, '@/'),
        import.meta.dirname,
      );
      if (p) queue.push(p);
    }
  }
  const seen = new Set<string>();
  while (queue.length) {
    const p = queue.pop()!;
    if (seen.has(p) || stop.has(p)) continue;
    seen.add(p);
    const file = ['.ts', '.tsx']
      .map((ext) => join(SRC, p + ext))
      .find(existsSync)!;
    for (const spec of importsOf(file)) {
      const next = resolve(spec, dirname(file));
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return seen;
}

const rows = [...builders.matchAll(/^\|\s*(\d+[a-d]?)\s*\|\s*(.+?)\s*\|/gm)];

test('BUILDERS.md names files (the import check can see its target)', () => {
  const named = rows.flatMap(([, , where]) => filesNamedBy(where));
  assert.ok(
    named.length >= 20,
    `only ${named.length} files parsed from BUILDERS.md`,
  );
  for (const f of named) {
    const base = join(import.meta.dirname, '..', '..', '..', 'src', f);
    assert.ok(
      existsSync(`${base}.ts`) || existsSync(`${base}.tsx`),
      `BUILDERS.md names ${f}, which is not in src`,
    );
  }
});

test('every file a BUILDERS.md row names is imported by the recorder, or listed as not exercised', () => {
  const imported = exercised();
  const gaps = rows
    .flatMap(([, id, where]) =>
      filesNamedBy(where).map((f) => [id, f] as const),
    )
    .filter(([, f]) => !imported.has(f) && !(f in NOT_EXERCISED))
    .map(([id, f]) => `${id}: ${f}`);
  assert.deepEqual(
    gaps,
    [],
    `named in BUILDERS.md but never imported:\n  ${gaps.join('\n  ')}`,
  );
  const stale = Object.keys(NOT_EXERCISED).filter((f) => imported.has(f));
  assert.deepEqual(
    stale,
    [],
    `listed as not exercised but now imported: ${stale.join(', ')}`,
  );
});

// ---------------------------------------------------------------- provenance

test('every snapshot has provenance in baseline.json, and every entry has a snapshot', async () => {
  const { readBaseline, SNAPSHOT_DIR } = await import('./snapshots');
  const baseline = readBaseline();
  const snapshots = readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.jsonl.gz'))
    .map((f) => f.replace(/\.jsonl\.gz$/, ''))
    .sort();
  assert.deepEqual(
    snapshots.filter((s) => !baseline[s]),
    [],
    'snapshots with no provenance: re-record them on development (RECORD=1)',
  );
  assert.deepEqual(
    Object.keys(baseline).filter((s) => !snapshots.includes(s)),
    [],
    'provenance entries with no snapshot: remove them from baseline.json',
  );
  for (const [id, p] of Object.entries(baseline)) {
    assert.match(
      p.srcTree,
      /^[0-9a-f]{40}$/,
      `${id}: srcTree is not a git tree id`,
    );
    assert.match(
      p.recordedOn,
      /^[0-9a-f]{40}$/,
      `${id}: recordedOn is not a commit id`,
    );
  }
});
