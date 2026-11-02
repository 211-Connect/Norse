import type { TaskConfig } from 'payload';

import { inNewTrace } from '@/lib/tracing';

/**
 * Gives each run of a job its own trace. Payload arms its `autoRun` crons
 * during `getPayload({ cron: true })`, inside whichever request reaches it
 * first, so without this every run for the life of the process joins that
 * request's trace (see docs/tracing.md).
 */
export function tracedTask<T extends TaskConfig<any>>(task: T): T {
  const { handler, slug } = task;
  if (typeof handler !== 'function') return task;
  return {
    ...task,
    handler: (args) => inNewTrace(`job ${slug}`, async () => handler(args)),
  };
}
