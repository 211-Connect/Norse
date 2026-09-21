'use server';

import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

type UpdatePrintableDirectoryQuerySourceParams = {
  directoryId: string;
  sectionId: string;
  sourceId: string;
  title?: string;
  queryParams: Record<string, unknown>;
  tenantId: string;
};

export async function updatePrintableDirectoryQuerySource({
  directoryId,
  sectionId,
  sourceId,
  title,
  queryParams,
  tenantId,
}: UpdatePrintableDirectoryQuerySourceParams): Promise<boolean> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

  try {
    await printableDirectoriesApiClient.printableDirectoryControllerUpdateSource(
      {
        id: directoryId,
        sectionId,
        sourceId,
      },
      {
        type: 'query',
        query: {
          title,
          params: queryParams,
        },
      },
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
