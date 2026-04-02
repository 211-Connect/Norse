import { ResourceDirectory } from '@/payload/payload-types';
import { cacheService } from '@/cacheService';
import { findTenantById } from '../../Tenants/actions';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { CacheKey, clearMemoryCache } from '@/utilities/withCache';
import { createLogger } from '@/lib/logger';

const log = createLogger('revalidateCache');

export async function revalidateCache({
  doc,
  req,
}): Promise<ResourceDirectory> {
  const tenantId = doc.tenant;

  if (typeof tenantId === 'string') {
    try {
      const tenant = await findTenantById(tenantId, false);

      if (tenant && tenant.trustedDomains) {
        const cacheKeys = tenant.trustedDomains.map(({ domain }): CacheKey => {
          const host = parseHost(domain);
          return `resource_directory:${host}:*`;
        });
        for (const key of cacheKeys) {
          await cacheService.delPattern(key);
        }
      }
    } catch (error) {
      log.error(
        { err: error, tenantId },
        'Error invalidating resource directory cache',
      );
    }
  }

  clearMemoryCache();

  return doc;
}
