/**
 * Event-loop health for the Node server (ISS-1739).
 *
 * Arcjet decisions time out at `ARCJET_TIMEOUT_MS` (500 ms) on a few percent
 * of requests on norse2-prod-search, while Redis times out at the same
 * moments and the MBOA app, calling the same Arcjet site, rarely does. Both
 * point at our own event loop being blocked, not at Arcjet. This module turns
 * that into a measurement:
 *
 * - `event_loop` log line every `intervalMs` per instance: delay p50 / p99 /
 *   max (ms) from `monitorEventLoopDelay`, and utilization (0–1, the share of
 *   time the loop was busy).
 * - `eventLoopDelayMs()`: how blocked the loop is right now, read when an
 *   Arcjet call fails so each timeout carries its own evidence.
 *
 * The reader has no Node-only imports, so `src/lib/arcjet` stays importable
 * from any runtime; `node:perf_hooks` is loaded only by the monitor.
 */

export const EVENT_LOOP_LOG_INTERVAL_MS = 10_000;
export const EVENT_LOOP_PROBE_PERIOD_MS = 50;
export const EVENT_LOOP_RECENT_WINDOW_MS = 1_000;

interface Sample {
  at: number;
  delayMs: number;
}

export interface EventLoopProbe {
  /** One timer callback; exposed for tests. */
  tick(): void;
  /**
   * The worst delay seen in the recent window, or the delay still building
   * up when the loop has been blocked since the last tick, whichever is
   * larger. The second case matters: a callback running right after a long
   * block can run before the probe's own timer has caught up.
   */
  delayMs(at?: number): number;
  start(): void;
  stop(): void;
}

export function createEventLoopProbe(
  periodMs = EVENT_LOOP_PROBE_PERIOD_MS,
  windowMs = EVENT_LOOP_RECENT_WINDOW_MS,
  now: () => number = () => performance.now(),
): EventLoopProbe {
  let lastTickAt = now();
  const recent: Sample[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;

  function prune(at: number) {
    while (recent.length > 0 && recent[0].at < at - windowMs) recent.shift();
  }

  const probe: EventLoopProbe = {
    tick() {
      const at = now();
      recent.push({ at, delayMs: Math.max(0, at - lastTickAt - periodMs) });
      lastTickAt = at;
      prune(at);
    },
    delayMs(at = now()) {
      prune(at);
      const building = Math.max(0, at - lastTickAt - periodMs);
      const worst = recent.reduce((max, s) => Math.max(max, s.delayMs), 0);
      return Math.round(Math.max(building, worst));
    },
    start() {
      if (timer) return;
      lastTickAt = now();
      timer = setInterval(probe.tick, periodMs);
      timer.unref?.();
    },
    stop() {
      clearInterval(timer);
      timer = undefined;
    },
  };
  return probe;
}

const PROBE_KEY = Symbol.for('norse.eventLoopProbe');
type ProbeHolder = { [PROBE_KEY]?: EventLoopProbe };

/**
 * Current event-loop delay in ms, or `undefined` when the monitor is not
 * running (Edge runtime, unit tests, before `register()`).
 */
export function eventLoopDelayMs(): number | undefined {
  return (globalThis as ProbeHolder)[PROBE_KEY]?.delayMs();
}

export type EventLoopLog = (data: Record<string, unknown>) => void;

const nsToMs = (ns: number) => Math.round(ns / 1e5) / 10;

/**
 * Start the per-interval `event_loop` log and the probe behind
 * `eventLoopDelayMs()`. Node runtime only. Returns a stop function.
 */
export async function createEventLoopMonitor(
  log: EventLoopLog,
  intervalMs = EVENT_LOOP_LOG_INTERVAL_MS,
): Promise<{ probe: EventLoopProbe; stop: () => void }> {
  const { monitorEventLoopDelay, performance: perf } =
    await import('node:perf_hooks');
  const probe = createEventLoopProbe();
  probe.start();

  // 20 ms is the sampling resolution: blocks shorter than that are not seen,
  // and ours that matter are hundreds of ms. The histogram includes the
  // resolution itself, so an idle loop reads about 21 ms, not 0.
  const histogram = monitorEventLoopDelay({ resolution: 20 });
  histogram.enable();
  let elu = perf.eventLoopUtilization();

  const timer = setInterval(() => {
    const next = perf.eventLoopUtilization();
    const { utilization } = perf.eventLoopUtilization(next, elu);
    elu = next;
    log({
      event: 'event_loop',
      intervalMs,
      p50Ms: nsToMs(histogram.percentile(50)),
      p99Ms: nsToMs(histogram.percentile(99)),
      maxMs: nsToMs(histogram.max),
      utilization: Math.round(utilization * 1000) / 1000,
    });
    histogram.reset();
  }, intervalMs);
  timer.unref?.();

  return {
    probe,
    stop() {
      clearInterval(timer);
      histogram.disable();
      probe.stop();
    },
  };
}

/** Process-wide monitor, started once from `register()`. */
export async function startEventLoopMonitor(log: EventLoopLog) {
  const holder = globalThis as ProbeHolder;
  if (holder[PROBE_KEY]) return;
  const { probe } = await createEventLoopMonitor(log);
  holder[PROBE_KEY] = probe;
}
