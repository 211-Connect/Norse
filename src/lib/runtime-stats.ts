/**
 * Process-wide counters and call timings, drained into the `event_loop` log
 * line every interval by `src/lib/event-loop-monitor.ts` (ISS-1739). Nothing
 * is logged per call: a call adds a number to an in-memory list, and the
 * monitor turns each list into count / errors / p50 / p95 / max once per
 * interval.
 *
 * The store lives on `globalThis`: Next.js bundles `instrumentation.ts` and
 * the pages separately, so a module-level map would not be shared between
 * the monitor and the code that records into it.
 *
 * Instance-level operations telemetry only. Per-tenant analytics of blocked
 * traffic belong to ISS-2366 (Norse-API), not here.
 */

/** Durations kept per name per interval; past this only the counts grow. */
export const MAX_TIMING_SAMPLES = 5_000;
/** Distinct timing / count names per interval; past this they fold into `other`. */
export const MAX_NAMES = 40;
/** Calls slower than this are counted separately (the Arcjet timeout). */
export const SLOW_MS = 500;

interface Timing {
  durations: number[];
  count: number;
  errors: number;
  slow: number;
}

interface Store {
  timings: Map<string, Timing>;
  counts: Map<string, number>;
}

export interface TimingSummary {
  count: number;
  errors: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  over500Ms: number;
}

const STORE_KEY = Symbol.for('norse.runtimeStats');
type StoreHolder = { [STORE_KEY]?: Store };

function store(): Store {
  const holder = globalThis as StoreHolder;
  holder[STORE_KEY] ??= { timings: new Map(), counts: new Map() };
  return holder[STORE_KEY];
}

function boundedName<T>(map: Map<string, T>, name: string): string {
  return map.has(name) || map.size < MAX_NAMES ? name : 'other';
}

export function recordTiming(name: string, ms: number, ok = true): void {
  const { timings } = store();
  const key = boundedName(timings, name);
  let t = timings.get(key);
  if (!t) {
    t = { durations: [], count: 0, errors: 0, slow: 0 };
    timings.set(key, t);
  }
  t.count += 1;
  if (!ok) t.errors += 1;
  if (ms > SLOW_MS) t.slow += 1;
  if (t.durations.length < MAX_TIMING_SAMPLES) t.durations.push(ms);
}

export function recordCount(name: string, n = 1): void {
  const { counts } = store();
  const key = boundedName(counts, name);
  counts.set(key, (counts.get(key) ?? 0) + n);
}

/** Nearest-rank percentile of an ascending list; 0 for an empty list. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Summaries since the last drain, then reset. */
export function drainRuntimeStats(): {
  timings: Record<string, TimingSummary>;
  counts: Record<string, number>;
} {
  const s = store();
  const timings: Record<string, TimingSummary> = {};
  for (const [name, t] of s.timings) {
    const sorted = [...t.durations].sort((a, b) => a - b);
    timings[name] = {
      count: t.count,
      errors: t.errors,
      p50Ms: round1(percentile(sorted, 50)),
      p95Ms: round1(percentile(sorted, 95)),
      maxMs: round1(sorted.at(-1) ?? 0),
      over500Ms: t.slow,
    };
  }
  const counts = Object.fromEntries(s.counts);
  s.timings = new Map();
  s.counts = new Map();
  return { timings, counts };
}
