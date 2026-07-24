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
): Promise<void> => {
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
      return;
    }

    const cacheKey = getHybridSearchConfigKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(cache));

    log.info({ tenantId }, 'Hybrid search config cache updated');
  } catch (error) {
    log.error(
      { err: error, tenantId },
      'Error pushing hybrid search config to cache',
    );
  }
};

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

  await pushHybridSearchConfigToCache(tenantId, req, {
    hybridSearchConfig: doc,
  });

  return doc;
};
