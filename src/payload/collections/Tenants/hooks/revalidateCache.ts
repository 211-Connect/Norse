import { Tenant } from '@/payload/payload-types';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';
import { createCacheKeyForAllLocales } from '../../ResourceDirectories/cache/keys';
import { createCacheKey } from '../cache/keys';

export async function revalidateCache({
  doc,
}: {
  doc: Tenant;
}): Promise<Tenant> {
  const cacheServiceInstance = cacheService();

  try {
    await Promise.all(
      doc.trustedDomains.map(async ({ domain }) => {
        const host = parseHost(domain);
        await cacheServiceInstance.delPattern(
          createCacheKeyForAllLocales(host),
        );
        await cacheServiceInstance.del(createCacheKey(parseHost(host)));
      }),
    );
  } catch {}

  return doc;
}
