/**
 * Event-loop health for the Node server (ISS-1739).
 *
 * Arcjet decisions time out at `ARCJET_TIMEOUT_MS` (500 ms) on a few percent
 * of requests on norse2-prod-search, while Redis times out at the same
 * moments and the MBOA app, calling the same Arcjet site, rarely does. Both
 * point at our own event loop being blocked, not at Arcjet.
 *
 * This file holds the probe behind `eventLoopDelayMs()` (how blocked the loop
 * is right now, read when an Arcjet call fails so each timeout carries its
 * own evidence) and the process-wide registry the monitor fills.
 *
 * This file has no Node-only imports, so `src/lib/arcjet` stays importable
 * from any runtime. The monitor itself is `src/lib/event-loop-monitor.ts`,
 * loaded only on the Node runtime.
 */

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

const INSTANCE_KEY = Symbol.for('norse.instanceId');
type InstanceHolder = { [INSTANCE_KEY]?: string };

/**
 * This container's hostname, set by the monitor; `undefined` before then.
 * Lets a failure log be joined to the `event_loop` lines of the same
 * instance (DigitalOcean's log prefix names the component, not the instance).
 */
export function instanceId(): string | undefined {
  return (globalThis as InstanceHolder)[INSTANCE_KEY];
}

/** Called once by `startEventLoopMonitor` (Node runtime). */
export function registerProcessProbe(probe: EventLoopProbe, instance: string) {
  (globalThis as ProbeHolder)[PROBE_KEY] = probe;
  (globalThis as InstanceHolder)[INSTANCE_KEY] = instance;
}

export function processProbeRegistered(): boolean {
  return (globalThis as ProbeHolder)[PROBE_KEY] !== undefined;
}
