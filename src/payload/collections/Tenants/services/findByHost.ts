import { Tenant } from '@/payload/payload-types';
import config from '@/payload/payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import { cacheService } from '@/cacheService';
import { createCacheKey } from '../cache/keys';

async function findByHostOrig(host: string): Promise<Tenant | null> {
  const cacheServiceInstance = cacheService();

  const cacheKey = createCacheKey(host);
  try {
    const cachedData = await cacheServiceInstance.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as Tenant;
    }
  } catch {}

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

  if (tenant) {
    try {
      await cacheServiceInstance.set(cacheKey, JSON.stringify(tenant));
    } catch {}
  }

  return tenant || null;
}

export const findByHost = cache(findByHostOrig);
