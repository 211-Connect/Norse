'use server';

export async function getTenantLocales(tenantId: string): Promise<string[]> {
  const { getPayloadSingleton } = await import('@/payload/getPayloadSingleton');
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
