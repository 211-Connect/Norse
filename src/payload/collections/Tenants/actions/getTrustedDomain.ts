'use server';

import { getPayload } from 'payload';
import config from '@/payload/payload-config';

export async function getTrustedDomain(
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
