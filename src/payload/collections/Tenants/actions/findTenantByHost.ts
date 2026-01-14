'use server';

import { Tenant } from '@/payload/payload-types';
import { getPayload } from 'payload';
import { cache } from 'react';
import { withRedisCache } from '@/payload/utilities';
import config from '@/payload/payload-config';

async function findByHostOrig(host: string): Promise<Tenant | null> {
  return await withRedisCache(`tenant:${host}`, async () => {
    const payload = await getPayload({ config });

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

export const findTenantByHost = cache(findByHostOrig);
