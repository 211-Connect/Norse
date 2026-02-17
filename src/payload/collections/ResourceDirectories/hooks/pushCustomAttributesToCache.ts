import { ResourceDirectory } from '@/payload/payload-types';
import { customAttributesCacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { buildCustomAttributesCache } from '../utilities/buildCustomAttributesCache';
import { CollectionAfterChangeHook } from 'payload';

export const pushCustomAttributesToCache: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, req, context }): Promise<ResourceDirectory> => {
  const tenantId = doc.tenant;

  if (typeof tenantId !== 'string') {
    console.warn(
      `[pushCustomAttributesToCache] Invalid tenant ID: ${tenantId}. Skipping cache update.`,
    );
    return doc;
  }

  try {
    const tenant = await findTenantById(tenantId);

    if (tenant && tenant.enabledLocales) {
      const { payload } = req;

      const customAttributesCache = await buildCustomAttributesCache(
        payload,
        tenantId,
        tenant.enabledLocales,
        doc,
        req.locale,
      );

      const cacheKey = `custom_attributes:${tenantId}`;
      await customAttributesCacheService.set(
        cacheKey,
        JSON.stringify(customAttributesCache),
      );

      console.log(
        `[pushCustomAttributesToCache] ✓ Pushed ${customAttributesCache.length} custom attributes for tenant ${tenantId}`,
      );
    }
  } catch (error) {
    console.error(
      `[pushCustomAttributesToCache] Error pushing custom attributes to cache:`,
      error,
    );
  }

  return doc;
};
