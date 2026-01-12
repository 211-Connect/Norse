'use server';

import { getPayload } from 'payload';

export async function getTrustedDomain(
  tenantId: string,
): Promise<string | null> {
  if (!tenantId) {
    return null;
  }

  const config = (await import('@/payload/payload-config')).default;
  const payload = await getPayload({ config });

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
  });

  return tenant?.trustedDomains?.[0]?.domain || null;
}
