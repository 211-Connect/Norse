import { Tenant } from '@/payload/payload-types';
import { Payload } from 'payload';

export async function findByTenantId(
  payload: Payload,
  tenantId: string,
): Promise<Tenant | null> {
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
