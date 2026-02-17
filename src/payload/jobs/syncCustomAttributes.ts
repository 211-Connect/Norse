import type { TaskConfig } from 'payload';
import { customAttributesCacheService } from '@/cacheService';
import { findTenantById } from '../collections/Tenants/actions';
import { buildCustomAttributesCache } from '../collections/ResourceDirectories/utilities/buildCustomAttributesCache';

export const syncCustomAttributes: TaskConfig<'syncCustomAttributes'> = {
  slug: 'syncCustomAttributes',
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
      name: 'syncedConfigurations',
      type: 'number',
      required: true,
    },
  ],
  handler: async ({ input, job, req }) => {
    const { payload } = req;
    const startTime = Date.now();

    console.log('[syncCustomAttributes] Handler started', {
      jobId: job.id,
      tenantIds: input.tenantIds?.length || 'all',
    });

    let tenantIds: string[] = [];

    if (!input.tenantIds || input.tenantIds.length === 0) {
      console.log(
        '[syncCustomAttributes] Fetching all tenants to sync custom attributes...',
      );
      const { docs: tenants } = await payload.find({
        collection: 'tenants',
        limit: 1000,
        pagination: false,
      });

      tenantIds = tenants.map((tenant) => tenant.id);
      console.log(
        `[syncCustomAttributes] Found ${tenantIds.length} tenants to sync`,
      );
    } else {
      tenantIds = input.tenantIds
        .map(({ tenantId }) => tenantId)
        .filter((id) => typeof id === 'string');
      console.log(
        `[syncCustomAttributes] Syncing ${tenantIds.length} specified tenants`,
      );
    }

    let syncedTenants = 0;
    let syncedConfigurations = 0;

    for (const tenantId of tenantIds) {
      try {
        const tenant = await findTenantById(tenantId);

        if (tenant && tenant.enabledLocales) {
          syncedTenants++;

          try {
            const customAttributesCache = await buildCustomAttributesCache(
              payload,
              tenantId,
              tenant.enabledLocales,
            );

            const cacheKey = `custom_attributes:${tenantId}`;
            await customAttributesCacheService.set(
              cacheKey,
              JSON.stringify(customAttributesCache),
            );

            syncedConfigurations++;
          } catch (error) {
            console.error(
              `[syncCustomAttributes] ✗ Error syncing custom attributes for tenant ${tenantId}:`,
              error,
            );
          }
        } else {
          console.log(
            `[syncCustomAttributes] ✗ No tenant or enabled locales found for tenant ID: ${tenantId}`,
          );
        }
      } catch (error) {
        console.error(
          `[syncCustomAttributes] ✗ Error syncing custom attributes for tenant ${tenantId}:`,
          error,
        );
      }
    }

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log('[syncCustomAttributes] Sync complete', {
      totalTenants: tenantIds.length,
      syncedTenants,
      syncedConfigurations,
      durationMs: duration,
      durationSeconds: `${durationSeconds}s`,
    });

    return {
      output: {
        success: true,
        syncedTenants,
        syncedConfigurations,
      },
    };
  },
  retries: 2,
};
