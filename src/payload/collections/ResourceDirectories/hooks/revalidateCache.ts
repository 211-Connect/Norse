import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';
import { CacheKey, clearMemoryCache } from '@/utilities/withCache';

import { findTenantById } from '../../Tenants/actions';

const log = createLogger('revalidateCache');

export async function revalidateCache({ doc }): Promise<ResourceDirectory> {
  const tenantId = doc.tenant;

  if (typeof tenantId === 'string') {
    try {
      const tenant = await findTenantById(tenantId, false);

      if (tenant && tenant.trustedDomains) {
        const resourceDirectoryKeys = tenant.trustedDomains.map(
          ({ domain }): CacheKey => {
            const host = parseHost(domain);
            return `resource_directory:${host}:*`;
          },
        );
        const appConfigKeys = tenant.trustedDomains.map(
          ({ domain }): CacheKey => {
            const host = parseHost(domain);
            return `app_config:${host}:*`;
          },
        );
        const cacheKeys = [...resourceDirectoryKeys, ...appConfigKeys];
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
