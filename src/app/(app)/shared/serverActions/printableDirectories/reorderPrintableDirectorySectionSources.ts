'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function reorderPrintableDirectorySectionSources(
  directoryId: string,
  sectionId: string,
  sourceIds: string[],
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerReorderSources(
        {
          id: directoryId,
          sectionId,
        },
        { sourceIds },
        {
          headers,
          cache: 'no-store',
        },
      );

    return response.data;
  } catch {
    return null;
  }
}
