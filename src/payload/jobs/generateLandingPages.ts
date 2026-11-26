import type { TaskConfig } from 'payload';

import {
  GENERATE_LANDING_PAGES_TASK,
  generateLandingPages as run,
} from '../services/landingPagesGeneration';
import { WARM_LANDING_PAGES_TASK } from '../services/landingPagesWarmup';

/**
 * Turns a Resource Directory's landing-page selection into page and address
 * rows (docs/landing-pages.md, "Generating pages"). Queued by Apply changes
 * on the Landing Pages tab, never by a plain save. Idempotent. Queues the
 * warm-up for the tenant when it is done.
 */
export const generateLandingPages: TaskConfig<'generateLandingPages'> = {
  slug: GENERATE_LANDING_PAGES_TASK,
  retries: 0,
  inputSchema: [{ name: 'tenantId', type: 'text', required: true }],
  outputSchema: [
    { name: 'creates', type: 'number', required: true },
    { name: 'retires', type: 'number', required: true },
    { name: 'revives', type: 'number', required: true },
    { name: 'unchanged', type: 'number', required: true },
    { name: 'addressChanges', type: 'number', required: true },
    { name: 'redirectsUpdated', type: 'number', required: true },
    { name: 'conflicts', type: 'number', required: true },
    { name: 'conflictList', type: 'json' },
  ],
  handler: async ({ input, req }) => {
    const output = await run(input.tenantId);
    // New pages get their results cached and counted right away.
    await req.payload.jobs.queue({
      task: WARM_LANDING_PAGES_TASK as 'warmLandingPages',
      input: { tenantId: input.tenantId },
      queue: 'landingPages',
    });
    return { output };
  },
};
