import type { TaskConfig } from 'payload';
import { findTenantByHost } from '../collections/Tenants/actions';
import {
  findResourceDirectoryByHost,
  findResourceDirectoryByTenantId,
} from '../collections/ResourceDirectories/actions';
import { createLogger } from '@/lib/logger';

const log = createLogger('warmCache');

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

    log.info(
      { jobId: job.id, domainCount: input.domains?.length || 'all' },
      'Handler started',
    );

    let domains: string[] = [];

    if (!input.domains || input.domains.length === 0) {
      log.debug('Fetching all tenants to resolve domains');
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

      log.info(
        { domainCount: domains.length },
        'Discovered domains for warming',
      );
    } else {
      domains = input.domains
        .map(({ domain }) => domain)
        .filter((domain) => typeof domain === 'string');
      log.info({ domainCount: domains.length }, 'Warming specified domains');
    }

    let warmedTenants = 0;
    let warmedResourceDirectories = 0;

    for (const domain of domains) {
      try {
        const tenant = await findTenantByHost(domain);
        if (tenant) {
          warmedTenants++;

          if (tenant.enabledLocales && tenant.enabledLocales.length > 0) {
            for (const locale of tenant.enabledLocales) {
              try {
                const resourceDirectory = await Promise.all([
                  findResourceDirectoryByHost(domain, locale),
                  findResourceDirectoryByTenantId(tenant.id, locale),
                ]);

                if (resourceDirectory) {
                  warmedResourceDirectories++;
                }
              } catch (error) {
                log.error(
                  { err: error, domain, locale },
                  'Error warming ResourceDirectory',
                );
              }
            }
          }
        } else {
          log.warn({ domain }, 'No tenant found for domain');
        }
      } catch (error) {
        log.error({ err: error, domain }, 'Error warming cache for domain');
      }
    }

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    log.info(
      {
        totalDomains: domains.length,
        warmedTenants,
        warmedResourceDirectories,
        durationMs: duration,
      },
      'Cache warming complete',
    );

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
