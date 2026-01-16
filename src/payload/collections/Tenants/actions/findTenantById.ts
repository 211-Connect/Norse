'use server';

import { Tenant } from '@/payload/payload-types';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function findTenantById(tenantId: string): Promise<Tenant | null> {
  const payload = await getPayloadSingleton();
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
