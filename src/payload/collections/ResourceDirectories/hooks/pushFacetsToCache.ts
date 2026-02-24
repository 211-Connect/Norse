import { ResourceDirectory } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { buildFacetsCache } from '../utilities/buildFacetsCache';
import { getFacetsKey } from '../utilities/getFacetsKey';
import { CollectionAfterChangeHook } from 'payload';
import { createLogger } from '@/lib/logger';

const log = createLogger('pushFacetsToCache');

export const pushFacetsToCache: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, req }): Promise<ResourceDirectory> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn({ tenantId }, 'Invalid tenant ID; skipping facets cache update');
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId);

    if (!tenant?.enabledLocales) {
      log.warn(
        { tenantId },
        'No tenant or enabled locales found; skipping facets cache update',
      );
      return doc;
    }

    const { payload } = req;

    const facetsCache = await buildFacetsCache(
      payload,
      tenantId,
      tenant.enabledLocales,
      doc,
      req.locale,
    );

    if (!facetsCache) {
      log.info(
        { tenantId },
        'No facets found for tenant; skipping cache update',
      );
      return doc;
    }

    const cacheKey = getFacetsKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(facetsCache));

    log.info(
      { tenantId, facetCount: facetsCache.facets.length },
      'Facets cache updated',
    );
  } catch (error) {
    log.error({ err: error, tenantId }, 'Error pushing facets to cache');
  }

  return doc;
};
