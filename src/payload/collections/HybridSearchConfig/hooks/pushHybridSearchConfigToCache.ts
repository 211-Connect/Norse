import { CollectionAfterChangeHook, PayloadRequest } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { HybridSearchConfig, ResourceDirectory } from '@/payload/payload-types';

import { buildHybridSearchConfigCache } from '../utilities/buildHybridSearchConfigCache';
import { getHybridSearchConfigKey } from '../utilities/getHybridSearchConfigKey';

const log = createLogger('pushHybridSearchConfigToCache');

/**
 * `pushed`: the cache now holds the new config. `skipped`: nothing to push (no
 * resource directory, or Redis disabled), so the cache did NOT change. `failed`:
 * the push threw (a Redis error or no connection included).
 */
export type HybridSearchCachePushResult = 'pushed' | 'skipped' | 'failed';

type Overrides = {
  hybridSearchConfig?: HybridSearchConfig | null;
  resourceDirectory?: ResourceDirectory | null;
};

export const pushHybridSearchConfigToCache = async (
  tenantId: string,
  req: PayloadRequest,
  overrides: Overrides = {},
): Promise<HybridSearchCachePushResult> => {
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
      return 'skipped';
    }

    const cacheKey = getHybridSearchConfigKey(tenantId);
    // setOrThrow: `set` logs and swallows a Redis error, which would read as 'pushed'.
    const written = await apiConfigCacheService.setOrThrow(
      cacheKey,
      JSON.stringify(cache),
    );
    if (!written) {
      log.warn(
        { tenantId },
        'Redis disabled; hybrid search config cache not updated',
      );
      return 'skipped';
    }

    log.info({ tenantId }, 'Hybrid search config cache updated');
    return 'pushed';
  } catch (error) {
    // Never throw here (an afterChange throw would roll back the save). Log
    // and report the failure to the caller.
    log.error(
      { err: error, tenantId },
      'Error pushing hybrid search config to cache',
    );
    return 'failed';
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
