import type { TaskConfig } from 'payload';
import { findTenantByHost } from '../collections/Tenants/actions';
import { findResourceDirectoryByHost } from '../collections/ResourceDirectories/actions';

export const warmCache: TaskConfig<'warmCache'> = {
  slug: 'warmCache',
  schedule: [
    {
      cron: '0 * * * *', // Every hour at minute 0
      queue: 'cache',
    },
  ],
  inputSchema: [
    {
      name: 'domains',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'domain',
          type: 'text',
        },
      ],
    },
  ],
  outputSchema: [
    {
      name: 'success',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'warmedTenants',
      type: 'number',
      required: true,
    },
    {
      name: 'warmedResourceDirectories',
      type: 'number',
      required: true,
    },
  ],
  handler: async ({ input, job, req }) => {
    const { payload } = req;
    const startTime = Date.now();

    console.log('[warmCache] Handler started', {
      jobId: job.id,
      domains: input.domains?.length || 'all',
    });

    let domains: string[] = [];

    if (!input.domains || input.domains.length === 0) {
      console.log('[warmCache] Fetching all tenants to get domains...');
      const { docs: tenants } = await payload.find({
        collection: 'tenants',
        limit: 1000,
        pagination: false,
      });

      for (const tenant of tenants) {
        if (tenant.trustedDomains) {
          for (const { domain } of tenant.trustedDomains) {
            domains.push(domain);
          }
        }
      }

      console.log(`[warmCache] Found ${domains.length} domains to warm`);
    } else {
      domains = input.domains
        .map(({ domain }) => domain)
        .filter((domain) => typeof domain === 'string');
      console.log(`[warmCache] Warming ${domains.length} specified domains`);
    }

    let warmedTenants = 0;
    let warmedResourceDirectories = 0;

    for (const domain of domains) {
      try {
        console.log(`[warmCache] Warming cache for domain: ${domain}`);

        const tenant = await findTenantByHost(domain);
        if (tenant) {
          warmedTenants++;
          console.log(`[warmCache] ✓ Tenant cache warmed for: ${domain}`);

          if (tenant.enabledLocales && tenant.enabledLocales.length > 0) {
            for (const locale of tenant.enabledLocales) {
              try {
                const resourceDirectory = await findResourceDirectoryByHost(
                  domain,
                  locale,
                );
                if (resourceDirectory) {
                  warmedResourceDirectories++;
                  console.log(
                    `[warmCache] ✓ ResourceDirectory cache warmed for: ${domain} (${locale})`,
                  );
                }
              } catch (error) {
                console.error(
                  `[warmCache] ✗ Error warming ResourceDirectory for ${domain} (${locale}):`,
                  error,
                );
              }
            }
          }
        } else {
          console.log(`[warmCache] ✗ No tenant found for domain: ${domain}`);
        }
      } catch (error) {
        console.error(
          `[warmCache] ✗ Error warming cache for domain ${domain}:`,
          error,
        );
      }
    }

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('[warmCache] Cache warming complete', {
      totalDomains: domains.length,
      warmedTenants,
      warmedResourceDirectories,
      durationMs: duration,
      durationSeconds: `${durationSeconds}s`,
    });

    return {
      output: {
        success: true,
        warmedTenants,
        warmedResourceDirectories,
      },
    };
  },
  retries: 2,
};
