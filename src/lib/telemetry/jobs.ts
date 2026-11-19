import { performance } from 'node:perf_hooks';

import { inNewTrace } from '@/lib/tracing';

import { lazy } from './meter';

/**
 * N8: Payload task telemetry.
 *
 * Every Payload task handler runs under one root span named `job <slug>` (via
 * `inNewTrace`, so an autoRun cron that fired inside a request never continues
 * that request's trace) and reports three instruments:
 *
 * - `norse.jobs.runs` counter, attributes `task`, `result`
 * - `norse.jobs.duration` histogram in seconds, attributes `task`, `result`
 * - `norse.jobs.last_success` observable gauge (unix seconds), attribute `task`
 *
 * `result` is `failed` when the handler throws, `noop` when a job reports that
 * it did not run, and `success` otherwise. `deliverScheduledPdfs` is hourly and
 * does nothing outside 03:00 America/New_York, so `output.ran === false` is a
 * `noop` and must not move `last_success`.
 */

export type JobResult = 'success' | 'failed' | 'noop';

const runs = lazy((meter) =>
  meter.createCounter('norse.jobs.runs', {
    description: 'Payload task runs by task and result',
  }),
);

const duration = lazy((meter) =>
  meter.createHistogram('norse.jobs.duration', {
    description: 'Payload task duration',
    unit: 's',
  }),
);

/**
 * Unix seconds of the last successful run per task. Read at collection time;
 * only successful runs are stored, and a noop never updates it.
 */
const lastSuccessAt = new Map<string, number>();

const lastSuccess = lazy((meter) => {
  const gauge = meter.createObservableGauge('norse.jobs.last_success', {
    description: 'Unix time of the last successful Payload task run',
    unit: 's',
  });
  gauge.addCallback((observable) => {
    for (const [task, timestamp] of lastSuccessAt) {
      observable.observe(timestamp, { task });
    }
  });
  return gauge;
});

/**
 * Classifies a handler's resolved value. Only `deliverScheduledPdfs` can be a
 * noop: its `output.ran` is false on every hourly tick outside the delivery
 * hour (and when SendGrid is not configured).
 */
export function jobResultFor(taskSlug: string, result: unknown): JobResult {
  if (taskSlug !== 'deliverScheduledPdfs') return 'success';
  if (typeof result !== 'object' || result === null || !('output' in result)) {
    return 'success';
  }
  const { output } = result;
  if (typeof output !== 'object' || output === null || !('ran' in output)) {
    return 'success';
  }
  return output.ran === false ? 'noop' : 'success';
}

function record(taskSlug: string, result: JobResult, seconds: number): void {
  runs().add(1, { task: taskSlug, result });
  duration().record(seconds, { task: taskSlug, result });
}

/**
 * Wraps a Payload task handler. Job logic is untouched: the handler receives
 * the same arguments and its resolve/reject behaviour passes through.
 */
export function withJobTelemetry<A, R>(
  taskSlug: string,
  handler: (args: A) => R,
): (args: A) => Promise<Awaited<R>> {
  return async (args: A): Promise<Awaited<R>> => {
    // Registers the observable gauge callback on first run, so it is collected
    // even before the task has ever succeeded (then with no data points).
    lastSuccess();

    const started = performance.now();
    try {
      const result = await inNewTrace(`job ${taskSlug}`, async () =>
        handler(args),
      );
      const jobResult = jobResultFor(taskSlug, result);
      record(taskSlug, jobResult, (performance.now() - started) / 1000);
      if (jobResult === 'success') {
        lastSuccessAt.set(taskSlug, Math.floor(Date.now() / 1000));
      }
      return result;
    } catch (error) {
      record(taskSlug, 'failed', (performance.now() - started) / 1000);
      throw error;
    }
  };
}
