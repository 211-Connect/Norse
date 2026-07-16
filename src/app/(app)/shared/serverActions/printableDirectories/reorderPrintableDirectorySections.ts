'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function reorderPrintableDirectorySections(
  directoryId: string,
  sectionIds: string[],
  tenantId?: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const headers = await getAuthHeaders(tenantId);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerReorderSections(
        { id: directoryId },
        { sectionIds },
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
