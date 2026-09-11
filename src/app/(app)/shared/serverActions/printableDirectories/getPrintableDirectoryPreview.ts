'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function getPrintableDirectoryPreview(
  id: string,
  locale: string,
  tenantId: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerPreview(
        { id, locale },
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
