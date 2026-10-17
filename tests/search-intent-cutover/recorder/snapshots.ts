// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// Golden snapshots, one gzipped JSONL file per path: { case, output }. RECORD=1 writes them from today's
// code; otherwise every case is compared with its snapshot. A case with no snapshot is a failure, never a
// pass, and so is a snapshot with no case.
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
): void {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
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
