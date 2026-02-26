'use server';

export async function getTenantTrustedDomain(
  tenantId: string,
): Promise<string | null> {
  if (!tenantId) {
    return null;
  }

  const { getPayloadSingleton } = await import('@/payload/getPayloadSingleton');
  const payload = await getPayloadSingleton();

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
  });

  return tenant?.trustedDomains?.[0]?.domain || null;
}
