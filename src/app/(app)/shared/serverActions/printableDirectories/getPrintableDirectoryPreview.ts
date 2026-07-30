'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function getPrintableDirectoryPreview(
  id: string,
  locale: string,
  tenantId?: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  const headers = await getAuthHeaders(tenantId);

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
