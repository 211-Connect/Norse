import { OrchestrationConfig } from '@/payload/payload-types';
import { customAttributesCacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { buildOrchestrationConfigCache } from '../utilities/buildOrchestrationConfigCache';
import { getOrchestrationConfigKey } from '../utilities/getOrchestrationConfigKey';
import { CollectionAfterChangeHook } from 'payload';

export const pushOrchestrationConfigToCache: CollectionAfterChangeHook<
  OrchestrationConfig
> = async ({ doc, req }): Promise<OrchestrationConfig> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    console.warn(
      `[pushOrchestrationConfigToCache] Invalid tenant ID: ${tenantId}. Skipping cache update.`,
    );
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId);

    if (!tenant?.enabledLocales) {
      console.warn(
        `[pushOrchestrationConfigToCache] No tenant or enabled locales found for tenant ID: ${tenantId}`,
      );
      return doc;
    }

    const { payload } = req;

    const orchestrationConfigCache = await buildOrchestrationConfigCache(
      payload,
      tenantId,
      tenant.enabledLocales,
      doc,
      req.locale,
    );

    if (!orchestrationConfigCache) {
      console.log(
        `[pushOrchestrationConfigToCache] No schemas found for tenant ${tenantId}`,
      );
      return doc;
    }

    const cacheKey = getOrchestrationConfigKey(tenantId);
    await customAttributesCacheService.set(
      cacheKey,
      JSON.stringify(orchestrationConfigCache),
    );

    console.log(
      `[pushOrchestrationConfigToCache] ✓ Pushed ${orchestrationConfigCache.schemas.length} schema(s) for tenant ${tenantId}`,
    );
  } catch (error) {
    console.error(
      `[pushOrchestrationConfigToCache] Error pushing orchestration config to cache:`,
      error,
    );
  }

  return doc;
};
