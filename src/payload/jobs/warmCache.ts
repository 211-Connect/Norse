import type { TaskConfig } from 'payload';
import { findTenantByHost } from '../collections/Tenants/actions';
import {
  findResourceDirectoryByHost,
  findResourceDirectoryByTenantId,
} from '../collections/ResourceDirectories/actions';
import { buildFacetsCache } from '../collections/ResourceDirectories/utilities/buildFacetsCache';
import { getFacetsKey } from '../collections/ResourceDirectories/utilities/getFacetsKey';
import { getRealmIdKey } from '../collections/Tenants/utilities/getRealmIdKey';
import { apiConfigCacheService } from '@/cacheService';

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
    {
      name: 'warmedFacets',
      type: 'number',
      required: true,
    },
    {
      name: 'warmedRealmIds',
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
    let warmedFacets = 0;
    let warmedRealmIds = 0;

    for (const domain of domains) {
      try {
        const tenant = await findTenantByHost(domain);
        if (tenant) {
          warmedTenants++;

          // Warm realmId cache
          try {
            const realmId = tenant.auth?.realmId;
            if (realmId) {
              const cacheKey = getRealmIdKey(tenant.id);
              await apiConfigCacheService.set(cacheKey, realmId);
              warmedRealmIds++;
              console.log(
                `[warmCache] ✓ Warmed realmId for tenant ${tenant.id}`,
              );
            }
          } catch (error) {
            console.error(
              `[warmCache] ✗ Error warming realmId for tenant ${tenant.id}:`,
              error,
            );
          }

          if (tenant.enabledLocales && tenant.enabledLocales.length > 0) {
            // Warm facets cache
            try {
              const facetsCache = await buildFacetsCache(
                payload,
                tenant.id,
                tenant.enabledLocales,
              );

              if (facetsCache) {
                const cacheKey = getFacetsKey(tenant.id);
                await apiConfigCacheService.set(
                  cacheKey,
                  JSON.stringify(facetsCache),
                );
                warmedFacets++;
                console.log(
                  `[warmCache] ✓ Warmed ${facetsCache.facets.length} facet(s) for tenant ${tenant.id}`,
                );
              }
            } catch (error) {
              console.error(
                `[warmCache] ✗ Error warming facets for tenant ${tenant.id}:`,
                error,
              );
            }

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
      warmedFacets,
      warmedRealmIds,
      durationMs: duration,
      durationSeconds: `${durationSeconds}s`,
    });

    return {
      output: {
        success: true,
        warmedTenants,
        warmedResourceDirectories,
        warmedFacets,
        warmedRealmIds,
      },
    };
  },
  retries: 2,
};
