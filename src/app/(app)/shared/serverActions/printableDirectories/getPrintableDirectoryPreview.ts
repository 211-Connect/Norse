'use server';

import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';

export async function getPrintableDirectoryPreview(
  id: string,
  locale: string,
  tenantId: string,
): Promise<PrintableDirectoryPreviewResponseDto | null> {
  if (!(await getPrintableDirectoryServerAccess(tenantId, locale))) {
    return null;
  }

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
