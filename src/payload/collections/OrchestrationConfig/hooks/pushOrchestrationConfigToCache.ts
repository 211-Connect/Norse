import { OrchestrationConfig } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { buildOrchestrationConfigCache } from '../utilities/buildOrchestrationConfigCache';
import { getOrchestrationConfigKey } from '../utilities/getOrchestrationConfigKey';
import { CollectionAfterChangeHook } from 'payload';
import { createLogger } from '@/lib/logger';

const log = createLogger('pushOrchestrationConfigToCache');

export const pushOrchestrationConfigToCache: CollectionAfterChangeHook<
  OrchestrationConfig
> = async ({ doc, req }): Promise<OrchestrationConfig> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping orchestration config cache update',
    );
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId);

    if (!tenant?.enabledLocales) {
      log.warn(
        { tenantId },
        'No tenant or enabled locales found; skipping orchestration config cache update',
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
      log.info(
        { tenantId },
        'No schemas found for tenant; skipping cache update',
      );
      return doc;
    }

    const cacheKey = getOrchestrationConfigKey(tenantId);
    await apiConfigCacheService.set(
      cacheKey,
      JSON.stringify(orchestrationConfigCache),
    );

    log.info(
      { tenantId, schemaCount: orchestrationConfigCache.schemas.length },
      'Orchestration config cache updated',
    );
  } catch (error) {
    log.error(
      { err: error, tenantId },
      'Error pushing orchestration config to cache',
    );
  }

  return doc;
};
