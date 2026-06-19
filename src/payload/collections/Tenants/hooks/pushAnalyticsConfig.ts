import { CollectionAfterChangeHook } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { Tenant } from '@/payload/payload-types';

const log = createLogger('pushAnalyticsConfigToCache');

export const pushAnalyticsConfigToCache = async (
  doc: Tenant,
): Promise<Tenant> => {
  const tenantId = doc.id;

  if (typeof tenantId !== 'string') {
    log.warn(
      { tenantId },
      'Invalid tenant ID; skipping analytics config cache update',
    );
    return doc;
  }

  // Fire and forget - don't block the database transaction
  const cacheOperation = async () => {
    try {
      await apiConfigCacheService.set(
        `analytics_config:${tenantId}`,
        JSON.stringify({
          additionalWebsiteIds: doc.analytics?.additionalWebsiteIds,
          umamiWebsiteId: doc.analytics?.umamiWebsiteId,
          apiKey: doc.analytics?.apiKey,
        }),
      );

      log.info({ tenantId }, 'analytics config cache updated');
    } catch (error) {
      log.error(
        { err: error, tenantId },
        'Error pushing analytics config to cache',
      );
    }
  };

  // Execute without awaiting to avoid blocking the transaction
  cacheOperation().catch((err) => {
    log.error(
      { err, tenantId },
      'Unhandled cache error in pushAnalyticsConfigToCache',
    );
  });

  return doc;
};

export const pushAnalyticsConfigToCacheAfterChangeHook: CollectionAfterChangeHook<
  Tenant
> = ({ doc }) => pushAnalyticsConfigToCache(doc);
