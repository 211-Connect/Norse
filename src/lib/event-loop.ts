/**
 * Event-loop utilization over one awaited call (ISS-1739).
 *
 * Arcjet decisions time out at `ARCJET_TIMEOUT_MS` on a few percent of
 * requests on norse2-prod-search. Whether that is Arcjet being slow or our
 * own main thread being too busy to read the answer in time cannot be told
 * from the timeout alone, so each failure is logged with the utilization of
 * the event loop *during the call*: the share of that wall time the main
 * thread spent busy (`performance.eventLoopUtilization`, Node only).
 *
 * - `durationMs` ≈ the timeout and utilization near 0: the loop was idle,
 *   the answer did not arrive. Arcjet or the network path.
 * - `durationMs` well over the timeout, or utilization near 1: the loop was
 *   busy, the timer and the response were both late. Our process.
 *
 * Nothing runs in the background: a sample is two numbers read at the start
 * of the call, and the utilization is the delta read at the end. Runtimes
 * without `eventLoopUtilization` (Edge, browsers) get `undefined`.
 */

export interface EventLoopSample {
  idle: number;
  active: number;
  utilization: number;
}

type EventLoopUtilization = (
  current?: EventLoopSample,
  previous?: EventLoopSample,
) => EventLoopSample;

function eventLoopUtilization(): EventLoopUtilization | undefined {
  const perf = globalThis.performance as
    { eventLoopUtilization?: EventLoopUtilization } | undefined;
  return perf?.eventLoopUtilization;
}

/** Cumulative idle/active time of the event loop, to pass to `since`. */
export function eventLoopSample(): EventLoopSample | undefined {
  return eventLoopUtilization()?.();
}

/**
 * Share of the time since `sample` that the event loop was busy, 0 to 1,
 * rounded to 3 decimals. `undefined` without a sample or off Node.
 */
export function eventLoopUtilizationSince(
  sample: EventLoopSample | undefined,
): number | undefined {
  const elu = eventLoopUtilization();
  if (!elu || !sample) return undefined;
  const delta = elu(elu(), sample);
  return Math.round(delta.utilization * 1000) / 1000;
}
