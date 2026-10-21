// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Golden snapshots, one gzipped JSONL file per path: { case, output }. RECORD=1 writes them from today's
// code; otherwise every case is compared with its snapshot. A case with no snapshot is a failure, never a
// pass, and so is a snapshot with no case.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

export const ROOT = join(import.meta.dirname, '..');
export const SNAPSHOT_DIR = join(ROOT, 'snapshots');
export const RECORDING = process.env.RECORD === '1';
export const BASELINE_FILE = join(SNAPSHOT_DIR, 'baseline.json');

/** Where each snapshot came from: the git tree of `src/` it was recorded on, and the development commit. */
export type Provenance = { srcTree: string; recordedOn: string; at: string };
export type Baseline = Record<string, Provenance>;

export function readBaseline(): Baseline {
  return existsSync(BASELINE_FILE)
    ? (JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) as Baseline)
    : {};
}

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/**
 * A snapshot is a baseline of today's behaviour only if it was recorded on unmodified production code.
 * Recording refuses unless `src/` is byte-identical to `RECORD_BASE` (default `origin/development`), both
 * in the commit and in the working tree, so a re-record on a feature branch cannot silently make every
 * harness agree with the feature branch.
 */
export function assertRecordable(): Omit<Provenance, 'at'> {
  const base = process.env.RECORD_BASE ?? 'origin/development';
  let srcTree: string;
  let baseTree: string;
  let recordedOn: string;
  try {
    srcTree = git('rev-parse', 'HEAD:src');
    baseTree = git('rev-parse', `${base}:src`);
    recordedOn = git('rev-parse', base);
  } catch (e) {
    throw new Error(`RECORD=1 could not read ${base}; fetch it first`, {
      cause: e,
    });
  }
  if (srcTree !== baseTree) {
    throw new Error(
      `RECORD=1 refused: src/ differs from ${base} (HEAD:src ${srcTree.slice(0, 12)}, ` +
        `${base}:src ${baseTree.slice(0, 12)}). A baseline records unmodified production code only; ` +
        `check out a commit whose src/ matches ${base}, or set RECORD_BASE deliberately.`,
    );
  }
  const dirty = git('status', '--porcelain', '--', 'src');
  if (dirty) {
    throw new Error(
      `RECORD=1 refused: src/ has uncommitted changes:\n${dirty}`,
    );
  }
  return { srcTree, recordedOn };
}

export type Row = {
  scenario: string;
  tenant: string;
  path: string;
  query: string;
  generation: string;
  modifiers: string[];
};

export function loadCorpus(): Row[] {
  const dir = join(ROOT, 'corpus');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()
    .flatMap((f) =>
      readFileSync(join(dir, f), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Row),
    );
}

/** Stable JSON: keys sorted, so a snapshot only changes when behaviour does. */
export function stable(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(
          Object.entries(val).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : val,
  );
}

export function digest(v: unknown): string {
  return createHash('sha256').update(stable(v)).digest('hex').slice(0, 16);
}

export function readSnapshot(path: string): Map<string, string> | null {
  const file = join(SNAPSHOT_DIR, `${path}.jsonl.gz`);
  if (!existsSync(file)) return null;
  const map = new Map<string, string>();
  for (const line of gunzipSync(readFileSync(file))
    .toString('utf8')
    .split('\n')) {
    if (!line) continue;
    const { case: id, output } = JSON.parse(line);
    map.set(id, stable(output));
  }
  return map;
}

export function writeSnapshot(
  path: string,
  rows: Array<{ case: string; output: unknown }>,
  provenance: Omit<Provenance, 'at'>,
): void {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const baseline = readBaseline();
  baseline[path] = { ...provenance, at: new Date().toISOString() };
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(baseline).sort(([a], [b]) => (a < b ? -1 : 1)),
      ),
      null,
      2,
    ) + '\n',
  );
  const body = rows
    .sort((a, b) => (a.case < b.case ? -1 : 1))
    .map((r) => stable({ case: r.case, output: r.output }))
    .join('\n');
  writeFileSync(
    join(SNAPSHOT_DIR, `${path}.jsonl.gz`),
    gzipSync(body + '\n', { level: 9 }),
  );
}

export type Comparison = {
  missing: string[];
  extra: string[];
  changed: Array<{ case: string; expected: string; actual: string }>;
};

export function compare(
  expected: Map<string, string>,
  actual: Array<{ case: string; output: unknown }>,
): Comparison {
  const seen = new Set<string>();
  const result: Comparison = { missing: [], extra: [], changed: [] };
  for (const { case: id, output } of actual) {
    seen.add(id);
    const want = expected.get(id);
    const got = stable(output);
    if (want === undefined) result.missing.push(id);
    else if (want !== got)
      result.changed.push({ case: id, expected: want, actual: got });
  }
  for (const id of expected.keys()) if (!seen.has(id)) result.extra.push(id);
  return result;
}
