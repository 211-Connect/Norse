import { ResourceDirectory } from '@/payload/payload-types';
import { apiConfigCacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { buildFacetsCache } from '../utilities/buildFacetsCache';
import { getFacetsKey } from '../utilities/getFacetsKey';
import { CollectionAfterChangeHook } from 'payload';

export const pushFacetsToCache: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, req }): Promise<ResourceDirectory> => {
  const tenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

  if (typeof tenantId !== 'string') {
    console.warn(
      `[pushFacetsToCache] Invalid tenant ID: ${tenantId}. Skipping cache update.`,
    );
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId);

    if (!tenant?.enabledLocales) {
      console.warn(
        `[pushFacetsToCache] No tenant or enabled locales found for tenant ID: ${tenantId}`,
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
      console.log(`[pushFacetsToCache] No facets found for tenant ${tenantId}`);
      return doc;
    }

    const cacheKey = getFacetsKey(tenantId);
    await apiConfigCacheService.set(cacheKey, JSON.stringify(facetsCache));

    console.log(
      `[pushFacetsToCache] ✓ Pushed ${facetsCache.facets.length} facet(s) for tenant ${tenantId}`,
    );
  } catch (error) {
    console.error(`[pushFacetsToCache] Error pushing facets to cache:`, error);
  }

  return doc;
};
