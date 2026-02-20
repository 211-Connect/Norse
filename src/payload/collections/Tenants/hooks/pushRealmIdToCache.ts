import { Tenant } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { getRealmIdKey } from '../utilities/getRealmIdKey';
import { CollectionAfterChangeHook } from 'payload';

export const pushRealmIdToCache: CollectionAfterChangeHook<Tenant> = async ({
  doc,
}): Promise<Tenant> => {
  const tenantId = doc.id;

  if (typeof tenantId !== 'string') {
    console.warn(
      `[pushRealmIdToCache] Invalid tenant ID: ${tenantId}. Skipping cache update.`,
    );
    return doc;
  }

  try {
    const realmId = doc.auth?.realmId;

    if (!realmId) {
      console.warn(
        `[pushRealmIdToCache] No realmId found for tenant ID: ${tenantId}`,
      );
      return doc;
    }

    const cacheKey = getRealmIdKey(tenantId);
    await apiConfigCacheService.set(cacheKey, realmId);

    console.log(
      `[pushRealmIdToCache] ✓ Pushed realmId for tenant ${tenantId}: ${realmId}`,
    );
  } catch (error) {
    console.error(
      `[pushRealmIdToCache] Error pushing realmId to cache:`,
      error,
    );
  }

  return doc;
};
