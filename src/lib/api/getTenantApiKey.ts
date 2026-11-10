'use server';

import { createLogger } from '@/lib/logger';
import { getTenantById } from '@/lib/cms/tenants';

const log = createLogger('getTenantApiKey');

/**
 * The tenant's Norse API key. Read from the tenant document, which
 * `getTenantById` caches (memory + Redis) and the Tenants `revalidateCache`
 * hook invalidates on save; no separate cache entry for the key.
 */
export async function getTenantApiKey(
  tenantId: string,
): Promise<string | null> {
  const tenant = await getTenantById(tenantId);
  const apiKey = tenant?.api?.apiKey ?? null;

  if (!apiKey) {
    log.warn({ tenantId }, 'Norse API key not configured for tenant');
    return null;
  }

  return apiKey;
}
