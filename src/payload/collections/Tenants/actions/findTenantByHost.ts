'use server';

import { Tenant } from '@/payload/payload-types';
import { withRedisCache } from '@/utilities/withRedisCache';

export async function findTenantByHost(host: string): Promise<Tenant | null> {
  return await withRedisCache(`tenant:${host}`, async () => {
    const { getPayloadSingleton } =
      await import('@/payload/getPayloadSingleton');
    const payload = await getPayloadSingleton();

    const {
      docs: [tenant],
    } = await payload.find({
      collection: 'tenants',
      where: {
        'trustedDomains.domain': {
          equals: host,
        },
      },
      limit: 1,
      pagination: false,
    });

    return tenant || null;
  });
}
