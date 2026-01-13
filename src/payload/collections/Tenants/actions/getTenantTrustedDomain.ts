'use server';

import config from '@/payload/payload-config';
import { getPayload } from 'payload';

export async function getTenantTrustedDomain(
  tenantId: string,
): Promise<string | null> {
  if (!tenantId) {
    return null;
  }

  const payload = await getPayload({ config });

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
  });

  return tenant?.trustedDomains?.[0]?.domain || null;
}
