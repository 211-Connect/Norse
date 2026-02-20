'use server';

import { Tenant } from '@/payload/payload-types';

export async function findTenantById(tenantId: string): Promise<Tenant | null> {
  const { getPayloadSingleton } = await import('@/payload/getPayloadSingleton');
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
