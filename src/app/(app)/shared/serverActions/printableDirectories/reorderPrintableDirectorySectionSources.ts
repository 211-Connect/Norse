'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function reorderPrintableDirectorySectionSources(
  directoryId: string,
  sectionId: string,
  sourceIds: string[],
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerReorderSources(
        {
          id: directoryId,
          sectionId,
        },
        { sourceIds },
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
