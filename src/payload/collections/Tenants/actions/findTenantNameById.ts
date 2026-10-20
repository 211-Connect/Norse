'use server';

import { headers } from 'next/headers';

import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

/**
 * The tenant's name, for the admin headers. A Server Action, so callable by
 * any client: it returns `null` unless a Payload user is signed in, reads
 * with that user's access rules, and returns the name only.
 */
export async function findTenantNameById(
  tenantId: string,
): Promise<string | null> {
  const payload = await getPayloadSingleton();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;

  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
      depth: 0,
      select: { name: true },
      overrideAccess: false,
      user,
    });
    return tenant?.name ?? null;
  } catch {
    return null;
  }
}
