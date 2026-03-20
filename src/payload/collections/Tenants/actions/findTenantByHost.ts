'use server';

import { Tenant } from '@/payload/payload-types';
import { withCache } from '@/utilities/withCache';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function findTenantByHost(host: string): Promise<Tenant | null> {
  return await withCache(
    `tenant:${host}`,
    async () => {
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
    },
    { redis: true, memory: true },
  );
}
