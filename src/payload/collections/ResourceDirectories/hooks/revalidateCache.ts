import { PayloadRequest } from 'payload';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';
import { createLogger } from '@/lib/logger';
import { ResourceDirectory } from '@/payload/payload-types';
import { shouldSkipSideEffects } from '@/payload/utilities/hookContext';
import { CacheKey, memoryCache } from '@/utilities/withCache';

import { findTenantById } from '../../Tenants/actions';

const log = createLogger('revalidateCache');

export async function revalidateCache({
  doc,
  req,
}: {
  doc: ResourceDirectory;
  req?: PayloadRequest;
}): Promise<ResourceDirectory> {
  // Translation jobs write each locale individually; they run this once after all locales instead.
  if (shouldSkipSideEffects(req?.context)) {
    return doc;
  }

  const tenantId = doc.tenant;

  if (typeof tenantId === 'string') {
    try {
      const tenant = await findTenantById(tenantId, false);

      if (tenant && tenant.trustedDomains) {
        const locales = tenant.enabledLocales?.length
          ? tenant.enabledLocales
          : ['en'];

        for (const { domain } of tenant.trustedDomains) {
          const host = parseHost(domain);

          await cacheService.delPattern(`resource_directory:${host}:*`);

          // Redis is invalidated for every locale via delPattern above; only the
          // per-process memory cache needs an explicit key per locale to avoid
          // wiping every other tenant's entries (see incident 2026-08-13).
          locales.forEach((locale) => {
            const memoryCacheKey: CacheKey = `resource_directory:${host}:${locale}`;
            memoryCache.delete(memoryCacheKey);
          });
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
