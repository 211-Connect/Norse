import { Tenant } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { getEnabledLocalesKey } from '../utilities/getEnabledLocalesKey';
import { CollectionAfterChangeHook } from 'payload';
import { createLogger } from '@/lib/logger';

const log = createLogger('pushEnabledLocalesToCache');

export const pushEnabledLocalesToCache: CollectionAfterChangeHook<
  Tenant
> = async ({ doc }): Promise<Tenant> => {
  const tenantId = doc.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping enabled locales cache update',
    );
    return doc;
  }

  // Fire and forget - don't block the database transaction
  const cacheOperation = async () => {
    try {
      const enabledLocales = doc.enabledLocales;

      if (!enabledLocales || !Array.isArray(enabledLocales)) {
        log.warn(
          { tenantId },
          'No enabled locales found; skipping cache update',
        );
        return;
      }

      const cacheKey = getEnabledLocalesKey(tenantId);
      await apiConfigCacheService.set(cacheKey, JSON.stringify(enabledLocales));

      log.info(
        { tenantId, localesCount: enabledLocales.length },
        'Enabled locales cache updated',
      );
    } catch (error) {
      log.error(
        { err: error, tenantId },
        'Error pushing enabled locales to cache',
      );
    }
  };

  // Execute without awaiting to avoid blocking the transaction
  cacheOperation().catch((err) => {
    log.error(
      { err, tenantId },
      'Unhandled cache error in pushEnabledLocalesToCache',
    );
  });

  return doc;
};
