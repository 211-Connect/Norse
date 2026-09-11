'use server';

import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function deletePrintableDirectory(
  id: string,
  tenantId: string,
): Promise<boolean> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

  try {
    await printableDirectoriesApiClient.printableDirectoryControllerRemove(
      { id },
      {
        headers,
        cache: 'no-store',
      },
    );

    return true;
  } catch {
    return false;
  }
}
