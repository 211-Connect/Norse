'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function getPrintableDirectoryPreview(
  id: string,
  locale: string,
  tenantId: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerPreview(
        { id, locale },
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, locale, true),
        },
      );

    return response.data;
  } catch {
    return null;
  }
}
