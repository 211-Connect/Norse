import type { TaskConfig } from 'payload';

import { withJobTelemetry } from '@/lib/telemetry/jobs';

/**
 * Gives each run of a job its own trace and its own metrics. Payload arms its
 * `autoRun` crons during `getPayload({ cron: true })`, inside whichever request
 * reaches it first, so without a new trace every run for the life of the
 * process joins that request's trace (see docs/observability.md). `withJobTelemetry`
 * adds the `norse.jobs.*` instruments (N8) without changing the handler.
 */
export function tracedTask<T extends TaskConfig<any>>(task: T): T {
  const { handler, slug } = task;
  if (typeof handler !== 'function') return task;
  return {
    ...task,
    handler: withJobTelemetry(slug, handler),
  };
}
