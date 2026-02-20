import { ResourceDirectory } from '@/payload/payload-types';

import { findTenantById } from '../../Tenants/actions';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { RedisCacheKey } from '@/utilities/withRedisCache';
import { createLogger } from '@/lib/logger';

const log = createLogger('revalidateCache');

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
          const { cacheService } = await import('@/cacheService');
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

  return doc;
}
