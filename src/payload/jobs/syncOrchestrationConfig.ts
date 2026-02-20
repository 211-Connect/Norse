import type { TaskConfig } from 'payload';
import { apiConfigCacheService } from '@/cacheService';
import { findTenantById } from '../collections/Tenants/actions';
import { buildOrchestrationConfigCache } from '../collections/OrchestrationConfig/utilities/buildOrchestrationConfigCache';
import { getOrchestrationConfigKey } from '../collections/OrchestrationConfig/utilities/getOrchestrationConfigKey';

export const syncOrchestrationConfig: TaskConfig<'syncOrchestrationConfig'> = {
  slug: 'syncOrchestrationConfig',
  schedule: [
    {
      cron: '0 * * * *', // Every hour at minute 0
      queue: 'cache',
    },
  ],
  inputSchema: [
    {
      name: 'tenantIds',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'tenantId',
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
      name: 'syncedTenants',
      type: 'number',
      required: true,
    },
    {
      name: 'syncedSchemas',
      type: 'number',
      required: true,
    },
  ],
  handler: async ({ input, job, req }) => {
    const { payload } = req;
    const startTime = Date.now();

    console.log('[syncOrchestrationConfig] Handler started', {
      jobId: job.id,
      tenantIds: input.tenantIds?.length || 'all',
    });

    let tenantIds: string[] = [];

    if (!input.tenantIds || input.tenantIds.length === 0) {
      console.log(
        '[syncOrchestrationConfig] Fetching all tenants to sync orchestration configs...',
      );
      const { docs: tenants } = await payload.find({
        collection: 'tenants',
        limit: 1000,
        pagination: false,
      });

      tenantIds = tenants.map((tenant) => tenant.id);
      console.log(
        `[syncOrchestrationConfig] Found ${tenantIds.length} tenants to sync`,
      );
    } else {
      tenantIds = input.tenantIds
        .map(({ tenantId }) => tenantId)
        .filter((id) => typeof id === 'string');
      console.log(
        `[syncOrchestrationConfig] Syncing ${tenantIds.length} specified tenants`,
      );
    }

    let syncedTenants = 0;
    let syncedSchemas = 0;

    for (const tenantId of tenantIds) {
      try {
        const tenant = await findTenantById(tenantId);

        if (!tenant?.enabledLocales) {
          console.log(
            `[syncOrchestrationConfig] ✗ No tenant or enabled locales found for tenant ID: ${tenantId}`,
          );
          continue;
        }

        const { docs: orchestrationConfigs } = await payload.find({
          collection: 'orchestration-config',
          where: {
            tenant: {
              equals: tenantId,
            },
          },
          limit: 1,
        });

        const orchestrationConfig = orchestrationConfigs[0];

        if (!orchestrationConfig) {
          console.log(
            `[syncOrchestrationConfig] ✗ No orchestration config found for tenant ID: ${tenantId}`,
          );
          continue;
        }

        try {
          const orchestrationConfigCache = await buildOrchestrationConfigCache(
            payload,
            tenantId,
            tenant.enabledLocales,
          );

          if (!orchestrationConfigCache) {
            console.log(
              `[syncOrchestrationConfig] ✗ No schemas found for tenant ${tenantId}`,
            );
            continue;
          }

          const cacheKey = getOrchestrationConfigKey(tenantId);
          await apiConfigCacheService.set(
            cacheKey,
            JSON.stringify(orchestrationConfigCache),
          );

          syncedTenants++;
          syncedSchemas += orchestrationConfigCache.schemas.length;

          console.log(
            `[syncOrchestrationConfig] ✓ Synced ${orchestrationConfigCache.schemas.length} schema(s) for tenant ${tenantId}`,
          );
        } catch (error) {
          console.error(
            `[syncOrchestrationConfig] ✗ Error syncing orchestration config for tenant ${tenantId}:`,
            error,
          );
        }
      } catch (error) {
        console.error(
          `[syncOrchestrationConfig] ✗ Error processing tenant ${tenantId}:`,
          error,
        );
      }
    }

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('[syncOrchestrationConfig] Sync complete', {
      totalTenants: tenantIds.length,
      syncedTenants,
      syncedSchemas,
      durationMs: duration,
      durationSeconds: `${durationSeconds}s`,
    });

    return {
      output: {
        success: true,
        syncedTenants,
        syncedSchemas,
      },
    };
  },
  retries: 2,
};
