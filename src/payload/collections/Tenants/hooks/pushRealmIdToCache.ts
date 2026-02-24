import { Tenant } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { getRealmIdKey } from '../utilities/getRealmIdKey';
import { CollectionAfterChangeHook } from 'payload';
import { createLogger } from '@/lib/logger';

const log = createLogger('pushRealmIdToCache');

export const pushRealmIdToCache: CollectionAfterChangeHook<Tenant> = async ({
  doc,
}): Promise<Tenant> => {
  const tenantId = doc.id;

  if (typeof tenantId !== 'string') {
    log.warn({ tenantId }, 'Invalid tenant ID; skipping realmId cache update');
    return doc;
  }

  // Fire and forget - don't block the database transaction
  const cacheOperation = async () => {
    try {
      const realmId = doc.auth?.realmId;

      if (!realmId) {
        log.warn({ tenantId }, 'No realmId found; skipping cache update');
        return;
      }

      const cacheKey = getRealmIdKey(tenantId);
      await apiConfigCacheService.set(cacheKey, realmId);

      log.info({ tenantId }, 'realmId cache updated');
    } catch (error) {
      log.error({ err: error, tenantId }, 'Error pushing realmId to cache');
    }
  };

  // Execute without awaiting to avoid blocking the transaction
  cacheOperation().catch((err) => {
    log.error({ err, tenantId }, 'Unhandled cache error in pushRealmIdToCache');
  });

  return doc;
};
