'use server';

import config from '@/payload/payload-config';
import { Tenant } from '@/payload/payload-types';
import { getPayload } from 'payload';

export async function findTenantById(tenantId: string): Promise<Tenant | null> {
  const payload = await getPayload({ config });
  const {
    docs: [tenant],
  } = await payload.find({
    collection: 'tenants',
    where: { id: { equals: tenantId } },
    limit: 1,
    pagination: false,
  });

  return tenant || null;
}
