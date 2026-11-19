import { CollectionAfterChangeHook, PayloadRequest } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { HybridSearchConfig, ResourceDirectory } from '@/payload/payload-types';

import { buildHybridSearchConfigCache } from '../utilities/buildHybridSearchConfigCache';
import { getHybridSearchConfigKey } from '../utilities/getHybridSearchConfigKey';

const log = createLogger('pushHybridSearchConfigToCache');

type Overrides = {
  hybridSearchConfig?: HybridSearchConfig | null;
  resourceDirectory?: ResourceDirectory | null;
};

export const pushHybridSearchConfigToCache = async (
  tenantId: string,
  req: PayloadRequest,
  overrides: Overrides = {},
): Promise<boolean> => {
  try {
    const { payload } = req;

    const hybridSearchConfig =
      overrides.hybridSearchConfig !== undefined
        ? overrides.hybridSearchConfig
        : await payload
            .find({
              collection: 'hybrid-search-config',
              where: { tenant: { equals: tenantId } },
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    const resourceDirectory =
      overrides.resourceDirectory !== undefined
        ? overrides.resourceDirectory
        : await payload
            .find({
              collection: 'resource-directories',
              where: { tenant: { equals: tenantId } },
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    const cache = buildHybridSearchConfigCache(
      tenantId,
      hybridSearchConfig,
      resourceDirectory,
    );

    if (!cache) {
      log.info(
        { tenantId },
        'No resource directory found for tenant; skipping hybrid search config cache update',
      );
      return true;
    }

    const cacheKey = getHybridSearchConfigKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(cache));

    log.info({ tenantId }, 'Hybrid search config cache updated');
    return true;
  } catch (error) {
    // Never throw here: an afterChange throw rolls back the whole save
    // (Payload calls killTransaction). Log with an alert tag and report failure.
    log.error(
      { err: error, tenantId, alert: HYBRID_SEARCH_CACHE_PUSH_ALERT },
      'Error pushing hybrid search config to cache',
    );
    return false;
  }
};

/** Set on `req.context` when the Redis push failed but the save was kept. */
export const HYBRID_SEARCH_CACHE_PUSH_FAILED_CONTEXT_KEY =
  'hybridSearchCachePushFailed';
export const HYBRID_SEARCH_CACHE_PUSH_ALERT = 'hybrid-search-cache-push-failed';

export const pushHybridSearchConfigToCacheAfterChangeHook: CollectionAfterChangeHook<
  HybridSearchConfig
> = async ({ doc, req }) => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping hybrid search config cache update',
    );
    return doc;
  }

  const ok = await pushHybridSearchConfigToCache(tenantId, req, {
    hybridSearchConfig: doc,
  });
  if (!ok) req.context[HYBRID_SEARCH_CACHE_PUSH_FAILED_CONTEXT_KEY] = true;

  return doc;
};
