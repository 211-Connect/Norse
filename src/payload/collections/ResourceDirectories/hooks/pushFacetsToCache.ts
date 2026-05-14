import { CollectionAfterChangeHook, PayloadRequest } from 'payload';

import { apiConfigCacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';

import { findTenantById } from '../../Tenants/actions';
import { buildFacetsCache } from '../utilities/buildFacetsCache';
import { getFacetsKey } from '../utilities/getFacetsKey';

const log = createLogger('pushFacetsToCache');

export const pushFacetsToCache = async (
  doc: ResourceDirectory,
  req: PayloadRequest,
  locale: string | undefined = req.locale,
): Promise<ResourceDirectory> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    log.warn({ tenantId }, 'Invalid tenant ID; skipping facets cache update');
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId, false);

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
      locale,
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

export const pushFacetsToCacheAfterChangeHook: CollectionAfterChangeHook<
  ResourceDirectory
> = ({ doc, req }) => pushFacetsToCache(doc, req);
