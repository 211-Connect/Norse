'use server';

import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function getTenantLocales(tenantId: string): Promise<string[]> {
  const payload = await getPayloadSingleton();

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
  });

  if (!tenant) {
    return [];
  }

  return tenant.enabledLocales;
}
