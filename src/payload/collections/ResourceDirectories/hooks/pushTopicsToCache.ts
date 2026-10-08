import { CollectionAfterChangeHook, PayloadRequest } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';

import { findTenantById } from '../../Tenants/actions';
import { buildTopicsCache } from '../utilities/buildTopicsCache';
import { getTopicsKey } from '../utilities/getTopicsKey';

const log = createLogger('pushTopicsToCache');

export const pushTopicsToCache = async (
  doc: ResourceDirectory,
  req: PayloadRequest,
  locale: string | undefined = req.locale,
): Promise<ResourceDirectory> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn({ tenantId }, 'Invalid tenant ID; skipping topics cache update');
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId, false);

    if (!tenant?.enabledLocales) {
      log.warn(
        { tenantId },
        'No tenant or enabled locales found; skipping topics cache update',
      );
      return doc;
    }

    const { payload } = req;

    const topicsCache = await buildTopicsCache(
      payload,
      tenantId,
      tenant.enabledLocales,
      doc,
      locale,
    );

    if (!topicsCache) {
      log.info(
        { tenantId },
        'No topics found for tenant; skipping cache update',
      );
      return doc;
    }

    const cacheKey = getTopicsKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(topicsCache));

    log.info(
      { tenantId, topicCount: topicsCache.list.length },
      'Topics cache updated',
    );
  } catch (error) {
    log.error({ err: error, tenantId }, 'Error pushing topics to cache');
  }

  return doc;
};

export const pushTopicsToCacheAfterChangeHook: CollectionAfterChangeHook<
  ResourceDirectory
> = ({ doc, req }) => pushTopicsToCache(doc, req);
