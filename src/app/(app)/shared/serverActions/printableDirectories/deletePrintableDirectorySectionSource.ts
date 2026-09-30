'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function deletePrintableDirectorySectionSource(
  directoryId: string,
  sectionId: string,
  sourceId: string,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerRemoveSource(
        {
          id: directoryId,
          sectionId,
          sourceId,
        },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    return response.data;
  } catch {
    return null;
  }
}
