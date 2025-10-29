import { Tenant } from '@/payload/payload-types';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import config from '@/payload/payload-config';
import { getPayload } from 'payload';
import { byTenantId } from '../cache/tags';
import { cache } from 'react';

async function findByHostOrig(host: string): Promise<Tenant | null> {
  'use cache';
  cacheLife('max');

  const payload = await getPayload({ config });

  const {
    docs: [tenant],
  } = await payload.find({
    collection: 'tenants',
    where: {
      'trustedDomains.domain': {
        contains: host,
      },
    },
    limit: 1,
    pagination: false,
  });

  if (tenant) {
    cacheTag(byTenantId(tenant.id));
  }

  return tenant || null;
}

export const findByHost = cache(findByHostOrig);
