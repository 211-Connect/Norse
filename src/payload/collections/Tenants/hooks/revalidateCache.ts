import { Tenant } from '@/payload/payload-types';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';
import { createCacheKeyForAllLocales } from '../../ResourceDirectories/cache/keys';
import { createCacheKey } from '../cache/keys';

export async function revalidateCache({
  doc,
  previousDoc,
}: {
  doc: Tenant;
  previousDoc?: Tenant;
}): Promise<Tenant> {
  const cacheServiceInstance = cacheService();

  const trustedDomains = Array.from(
    new Set<string>([
      ...doc.trustedDomains.map(({ domain }) => domain),
      ...(previousDoc
        ? previousDoc.trustedDomains.map(({ domain }) => domain)
        : []),
    ]),
  );

  try {
    await Promise.all(
      trustedDomains.map(async (domain) => {
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
