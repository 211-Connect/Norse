import { metrics, type Meter } from '@opentelemetry/api';

/**
 * Lazy access to the metric instruments.
 *
 * The metrics API has no proxy provider (unlike `trace`): a Meter taken before
 * `metrics.setGlobalMeterProvider()` is a permanent no-op, silently. So never
 * cache a meter or an instrument at module load, and never take one while the
 * global provider is still the API's no-op default.
 *
 * `register()` calls `markTelemetryReady()` once the meter provider is
 * installed; before that every helper below hands out no-op instruments and
 * caches nothing.
 */
let telemetryReady = false;
let meter: Meter | undefined;

/**
 * Called by `register()` after `registerOTel()` has installed the meter
 * provider. Drops any meter resolved earlier (which would have been a no-op).
 */
export function markTelemetryReady(): void {
  telemetryReady = true;
  meter = undefined;
}

export function isTelemetryReady(): boolean {
  return telemetryReady;
}

/**
 * The `norse-app` meter. Not memoised until `markTelemetryReady()`, so a call
 * that happens too early cannot poison every later instrument.
 */
export function norseMeter(): Meter {
  if (!telemetryReady) {
    return metrics.getMeter('norse-app');
  }
  if (meter === undefined) {
    meter = metrics.getMeter('norse-app');
  }
  return meter;
}

/**
 * Creates an instrument on first use and memoises it — but only when the real
 * meter provider is in place. Before `markTelemetryReady()` the factory runs
 * on every call and nothing is cached, because the resulting instrument would
 * be a no-op forever.
 *
 * ```ts
 * const downstreamRequests = lazy((meter) =>
 *   meter.createCounter('norse.downstream.requests'),
 * );
 * // ... later, inside the request path:
 * downstreamRequests().add(1, { dependency, operation, outcome });
 * ```
 */
export function lazy<T>(create: (meter: Meter) => T): () => T {
  let value: T | undefined;
  return () => {
    if (telemetryReady && value !== undefined) {
      return value;
    }
    const instrument = create(norseMeter());
    if (telemetryReady) {
      value = instrument;
    }
    return instrument;
  };
}
