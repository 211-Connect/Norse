import { ResourceDirectory } from '@/payload/payload-types';
import { cacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { RedisCacheKey } from '@/payload/utilities';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';

export async function revalidateCache({
  doc,
  req,
}): Promise<ResourceDirectory> {
  const tenantId = doc.tenant;

  if (typeof tenantId === 'string') {
    try {
      const tenant = await findTenantById(tenantId);

      if (tenant && tenant.trustedDomains) {
        const cacheKeys = tenant.trustedDomains.map(
          ({ domain }): RedisCacheKey => {
            const host = parseHost(domain);
            return `resource_directory:${host}:*`;
          },
        );
        for (const key of cacheKeys) {
          await cacheService.delPattern(key);
        }
      }
    } catch (error) {
      console.error('Error invalidating resource directory cache:', error);
    }
  }

  return doc;
}
