import { Tenant } from '@/payload/payload-types';

import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';

export async function revalidateCache({
  doc,
  previousDoc,
}: {
  doc?: Tenant;
  previousDoc?: Tenant;
}): Promise<Tenant | undefined> {
  const trustedDomains = Array.from(
    new Set<string>([
      ...(doc?.trustedDomains?.map(({ domain }) => domain) ?? []),
      ...(previousDoc?.trustedDomains?.map(({ domain }) => domain) ?? []),
    ]),
  );

  // Fire and forget - don't block the database transaction
  const cacheOperation = async () => {
    try {
      await Promise.all(
        trustedDomains.map(async (domain) => {
          const host = parseHost(domain);
          await cacheService.delPattern(`tenant_locale:${host}`);
          await cacheService.del(`tenant:${host}`);
          await cacheService.delPattern(`resource_directory:${host}:*`);
        }),
      );
    } catch (error) {
      console.error('Error invalidating tenant cache:', error);
    }
  };

  // Execute without awaiting to avoid blocking the transaction
  cacheOperation().catch((err) => {
    console.error('[revalidateCache] Unhandled cache error:', err);
  });

  return doc;
}
