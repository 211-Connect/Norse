import type { TaskConfig } from 'payload';

import {
  WARM_LANDING_PAGES_TASK,
  warmLandingPages as run,
} from '../services/landingPagesWarmup';

/**
 * Warms every live landing page's search and map pins in Redis and records
 * its result count (docs/landing-pages.md, "Warm-up and count job").
 * Nightly for every tenant with landing pages on, and queued for one tenant
 * after each generation run.
 */
export const warmLandingPages: TaskConfig<'warmLandingPages'> = {
  slug: WARM_LANDING_PAGES_TASK,
  retries: 0,
  schedule: [
    // After the nightly cache warm-up (midnight), outside visitor peaks.
    { cron: '30 3 * * *', queue: 'landingPages' },
  ],
  inputSchema: [{ name: 'tenantId', type: 'text' }],
  outputSchema: [
    { name: 'tenants', type: 'number', required: true },
    { name: 'pages', type: 'number', required: true },
    { name: 'warmed', type: 'number', required: true },
    { name: 'zeroResults', type: 'number', required: true },
    { name: 'failed', type: 'number', required: true },
  ],
  handler: async ({ input }) => ({ output: await run(input?.tenantId) }),
};
