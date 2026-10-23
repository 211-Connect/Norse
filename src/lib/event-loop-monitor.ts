/**
 * Node-runtime health monitor (ISS-1739). Started once per process from
 * `register()` in `src/instrumentation.ts`; never import it from code that
 * can run on the Edge runtime.
 *
 * One `event_loop` line per instance every 10 s answers, for that interval:
 *
 * - Is the loop blocked? `p50Ms` / `p99Ms` / `maxMs` delay, `utilization`.
 * - Is it CPU, and is it our main thread? `cpuPct` (process, all threads)
 *   next to `utilization` (main thread only). On a 1-vCPU instance a
 *   `cpuPct` well above `utilization × 100` means work off the main thread
 *   (GC helpers, libuv, image optimisation).
 * - Is it memory / GC? `memMb` and `gc` (count, total and max pause, major
 *   collections).
 * - Is it load? `counts` (pages per Arcjet conclusion) and `timings.arcjet`.
 * - Are other remote calls slow at the same time? `timings` per dependency
 *   (`arcjet`, `redis`, `fetch:<host>`): if they all slow down together the
 *   cause is our process; if only one does, it is that dependency.
 * - Is it DNS or the libuv threadpool? `canary.dnsMs` (a `dns.lookup` of the
 *   Arcjet host) and `canary.fsMs` (an `fs.stat`), both threadpool work.
 * - Is something piling up? `handles` (active libuv resources by type).
 *
 * When an interval looks saturated (`utilization` ≥ 0.9 or `maxMs` ≥ 1 s),
 * the monitor records one 5 s V8 CPU profile and logs `cpu_profile`: the
 * functions that used the most CPU. At most once per 15 min per instance;
 * `EVENT_LOOP_PROFILE=off` turns it off.
 */
import { subscribe } from 'node:diagnostics_channel';
import { lookup } from 'node:dns/promises';
import { stat } from 'node:fs/promises';
import { Session } from 'node:inspector/promises';
import { hostname } from 'node:os';
import {
  constants,
  monitorEventLoopDelay,
  performance,
  PerformanceObserver,
} from 'node:perf_hooks';

import {
  createEventLoopProbe,
  type EventLoopProbe,
  processProbeRegistered,
  registerProcessProbe,
} from './event-loop';
import { drainRuntimeStats, recordTiming } from './runtime-stats';

export const EVENT_LOOP_LOG_INTERVAL_MS = 10_000;
export const PROFILE_DURATION_MS = 5_000;
export const PROFILE_COOLDOWN_MS = 15 * 60_000;
export const PROFILE_UTILIZATION = 0.9;
export const PROFILE_MAX_DELAY_MS = 1_000;
const CANARY_HOST = 'decide.arcjet.com';

export type MonitorLog = (data: Record<string, unknown>) => void;

const nsToMs = (ns: number) => Math.round(ns / 1e5) / 10;
const round1 = (n: number) => Math.round(n * 10) / 10;
const mb = (bytes: number) => Math.round(bytes / 1e5) / 10;

// ---------- CPU profile summary ----------

interface ProfileNode {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  hitCount?: number;
}
export interface CpuProfile {
  nodes: ProfileNode[];
  startTime: number; // µs
  endTime: number; // µs
  samples?: number[];
}

/** `file:///opt/norse/app/.next/server/chunks/x.js` → `.next/server/chunks/x.js`. */
export function shortLocation(url: string, line: number): string {
  if (!url) return '';
  let path = url.replace(/^file:\/\//, '');
  const nm = path.lastIndexOf('/node_modules/');
  if (nm >= 0) {
    path = path.slice(nm + 1);
  } else {
    const app = path.indexOf('/.next/');
    if (app >= 0) path = path.slice(app + 1);
  }
  return `${path}:${line + 1}`;
}

/**
 * Self time per function, top N. `(garbage collector)`, `(program)` and
 * `(idle)` are V8's own buckets and are reported separately.
 */
export function summarizeProfile(profile: CpuProfile, topN = 15) {
  const durationMs = (profile.endTime - profile.startTime) / 1000;
  const totalHits = profile.nodes.reduce((n, x) => n + (x.hitCount ?? 0), 0);
  const msPerHit = totalHits > 0 ? durationMs / totalHits : 0;
  const byFn = new Map<string, { fn: string; loc: string; hits: number }>();
  const special: Record<string, number> = {};
  for (const node of profile.nodes) {
    const hits = node.hitCount ?? 0;
    if (hits === 0) continue;
    const { functionName, url, lineNumber } = node.callFrame;
    if (/^\(.*\)$/.test(functionName) && !url) {
      special[functionName] = (special[functionName] ?? 0) + hits;
      continue;
    }
    const fn = functionName || '(anonymous)';
    const loc = shortLocation(url, lineNumber);
    const key = `${fn}@${loc}`;
    const entry = byFn.get(key) ?? { fn, loc, hits: 0 };
    entry.hits += hits;
    byFn.set(key, entry);
  }
  const pct = (hits: number) =>
    totalHits > 0 ? round1((100 * hits) / totalHits) : 0;
  return {
    durationMs: Math.round(durationMs),
    samples: totalHits,
    idlePct: pct(special['(idle)'] ?? 0),
    gcPct: pct(special['(garbage collector)'] ?? 0),
    programPct: pct(special['(program)'] ?? 0),
    top: [...byFn.values()]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, topN)
      .map((e) => ({
        fn: e.fn,
        loc: e.loc,
        selfMs: Math.round(e.hits * msPerHit),
        pct: pct(e.hits),
      })),
  };
}

export async function captureCpuProfile(
  durationMs = PROFILE_DURATION_MS,
): Promise<CpuProfile> {
  const session = new Session();
  session.connect();
  try {
    await session.post('Profiler.enable');
    await session.post('Profiler.setSamplingInterval', { interval: 1000 });
    await session.post('Profiler.start');
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    const { profile } = await session.post('Profiler.stop');
    return profile as CpuProfile;
  } finally {
    session.disconnect();
  }
}

/** Whether this interval should trigger a profile. */
export function shouldProfile(
  interval: { utilization: number; maxMs: number },
  now: number,
  lastProfileAt: number | undefined,
  cooldownMs = PROFILE_COOLDOWN_MS,
): boolean {
  if (lastProfileAt !== undefined && now - lastProfileAt < cooldownMs) {
    return false;
  }
  return (
    interval.utilization >= PROFILE_UTILIZATION ||
    interval.maxMs >= PROFILE_MAX_DELAY_MS
  );
}

// ---------- outbound fetch timings ----------

let fetchSubscribed = false;

/**
 * Time every `fetch` (undici) by origin host, through Node's diagnostics
 * channels: no wrapper around fetch, nothing per request in the logs.
 */
function subscribeFetchTimings() {
  if (fetchSubscribed) return;
  fetchSubscribed = true;
  const started = new WeakMap<object, number>();
  const name = (request: { origin?: string | URL }) => {
    try {
      return `fetch:${new URL(String(request.origin)).host}`;
    } catch {
      return 'fetch:unknown';
    }
  };
  subscribe('undici:request:create', (msg) => {
    const { request } = msg as { request: object };
    started.set(request, performance.now());
  });
  subscribe('undici:request:headers', (msg) => {
    const { request, response } = msg as {
      request: { origin?: string };
      response: { statusCode: number };
    };
    const t = started.get(request);
    if (t === undefined) return;
    started.delete(request);
    recordTiming(
      name(request),
      performance.now() - t,
      response.statusCode < 500,
    );
  });
  subscribe('undici:request:error', (msg) => {
    const { request } = msg as { request: { origin?: string } };
    const t = started.get(request);
    if (t === undefined) return;
    started.delete(request);
    recordTiming(name(request), performance.now() - t, false);
  });
}

// ---------- monitor ----------

export interface MonitorOptions {
  intervalMs?: number;
  profile?: boolean;
  /** Test seam: replaces the 5 s V8 profile. */
  captureProfile?: () => Promise<CpuProfile>;
  cooldownMs?: number;
}

export async function createEventLoopMonitor(
  log: MonitorLog,
  options: MonitorOptions = {},
): Promise<{ probe: EventLoopProbe; stop: () => void }> {
  const intervalMs = options.intervalMs ?? EVENT_LOOP_LOG_INTERVAL_MS;
  const profileEnabled = options.profile ?? true;
  const capture = options.captureProfile ?? (() => captureCpuProfile());
  const cooldownMs = options.cooldownMs ?? PROFILE_COOLDOWN_MS;
  const instance = hostname();
  const startedAt = performance.now();

  const probe = createEventLoopProbe();
  probe.start();

  // 20 ms is the sampling resolution: blocks shorter than that are not seen,
  // and ours that matter are hundreds of ms. The histogram includes the
  // resolution itself, so an idle loop reads about 21 ms, not 0.
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();
  let elu = performance.eventLoopUtilization();
  let cpu = process.cpuUsage();
  let lastAt = performance.now();

  const gc = { count: 0, totalMs: 0, maxMs: 0, majorCount: 0, majorMs: 0 };
  const gcObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const kind = (entry as { detail?: { kind?: number } }).detail?.kind;
      gc.count += 1;
      gc.totalMs += entry.duration;
      gc.maxMs = Math.max(gc.maxMs, entry.duration);
      if (kind === constants.NODE_PERFORMANCE_GC_MAJOR) {
        gc.majorCount += 1;
        gc.majorMs += entry.duration;
      }
    }
  });
  gcObserver.observe({ entryTypes: ['gc'] });

  subscribeFetchTimings();

  let canary: Record<string, unknown> = {};
  let canaryRunning = false;
  async function runCanary() {
    if (canaryRunning) return;
    canaryRunning = true;
    const result: Record<string, unknown> = {};
    try {
      let t = performance.now();
      try {
        await lookup(CANARY_HOST);
      } catch (error) {
        result.dnsError =
          error instanceof Error ? error.message : String(error);
      }
      result.dnsMs = round1(performance.now() - t);
      t = performance.now();
      await stat(process.cwd()).catch(() => undefined);
      result.fsMs = round1(performance.now() - t);
    } finally {
      canary = result;
      canaryRunning = false;
    }
  }

  let lastProfileAt: number | undefined;
  let profiling = false;

  const timer = setInterval(() => {
    const now = performance.now();
    const elapsedMs = now - lastAt;
    lastAt = now;
    const nextElu = performance.eventLoopUtilization();
    const { utilization } = performance.eventLoopUtilization(nextElu, elu);
    elu = nextElu;
    const cpuDelta = process.cpuUsage(cpu);
    cpu = process.cpuUsage();
    const mem = process.memoryUsage();
    const handles: Record<string, number> = {};
    for (const type of process.getActiveResourcesInfo()) {
      handles[type] = (handles[type] ?? 0) + 1;
    }
    const { timings, counts } = drainRuntimeStats();
    const maxMs = nsToMs(histogram.max);
    const util = Math.round(utilization * 1000) / 1000;

    log({
      event: 'event_loop',
      instance,
      uptimeS: Math.round((now - startedAt) / 1000),
      intervalMs: Math.round(elapsedMs),
      p50Ms: nsToMs(histogram.percentile(50)),
      p99Ms: nsToMs(histogram.percentile(99)),
      maxMs,
      utilization: util,
      cpuPct: round1(
        ((cpuDelta.user + cpuDelta.system) / 1000 / elapsedMs) * 100,
      ),
      memMb: {
        rss: mb(mem.rss),
        heapUsed: mb(mem.heapUsed),
        heapTotal: mb(mem.heapTotal),
        external: mb(mem.external),
      },
      gc: {
        count: gc.count,
        totalMs: round1(gc.totalMs),
        maxMs: round1(gc.maxMs),
        majorCount: gc.majorCount,
        majorMs: round1(gc.majorMs),
      },
      handles,
      counts,
      timings,
      canary,
    });
    histogram.reset();
    Object.assign(gc, {
      count: 0,
      totalMs: 0,
      maxMs: 0,
      majorCount: 0,
      majorMs: 0,
    });
    void runCanary();

    if (
      profileEnabled &&
      !profiling &&
      shouldProfile(
        { utilization: util, maxMs },
        now,
        lastProfileAt,
        cooldownMs,
      )
    ) {
      profiling = true;
      lastProfileAt = now;
      const trigger = { utilization: util, maxMs };
      capture()
        .then((profile) =>
          log({
            event: 'cpu_profile',
            instance,
            trigger,
            ...summarizeProfile(profile),
          }),
        )
        .catch((error) =>
          log({
            event: 'cpu_profile_failed',
            instance,
            message: error instanceof Error ? error.message : String(error),
          }),
        )
        .finally(() => {
          profiling = false;
        });
    }
  }, intervalMs);
  timer.unref?.();

  return {
    probe,
    stop() {
      clearInterval(timer);
      histogram.disable();
      gcObserver.disconnect();
      probe.stop();
    },
  };
}

/** Process-wide monitor, started once from `register()`. */
export async function startEventLoopMonitor(log: MonitorLog) {
  if (processProbeRegistered()) return;
  const { probe } = await createEventLoopMonitor(log, {
    profile: process.env.EVENT_LOOP_PROFILE !== 'off',
  });
  registerProcessProbe(probe, hostname());
}
