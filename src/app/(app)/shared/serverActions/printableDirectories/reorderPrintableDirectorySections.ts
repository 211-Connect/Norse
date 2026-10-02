'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function reorderPrintableDirectorySections(
  directoryId: string,
  sectionIds: string[],
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerReorderSections(
        { id: directoryId },
        { sectionIds },
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
