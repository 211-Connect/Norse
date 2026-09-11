'use server';

import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { withCache } from '@/utilities/withCache';

const log = createLogger('getTenantApiKey');

async function fetchTenantApiKey(tenantId: string): Promise<string | null> {
  const payload = await getPayloadSingleton();
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
    overrideAccess: true,
  });
  return tenant?.api?.apiKey ?? null;
}

export async function getTenantApiKey(tenantId: string): Promise<string> {
  const apiKey = await withCache(
    `tenant_api_key:${tenantId}`,
    () => fetchTenantApiKey(tenantId),
    { redis: true, memory: true },
  );

  if (!apiKey) {
    log.error({ tenantId }, 'Norse API key not configured for tenant');
    throw new Error(
      `Norse API key not configured for tenant "${tenantId}". Set it under Tenants > API Settings in the Payload admin, or use the bulk-set endpoint.`,
    );
  }

  return apiKey;
}

export async function getTenantApiKeyHeaders(
  tenantId: string,
): Promise<Record<string, string>> {
  return { 'x-tenant-api-key': await getTenantApiKey(tenantId) };
}
