'use server';

import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';

export async function getPrintableDirectoryById(
  id: string,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  if (!(await getPrintableDirectoryServerAccess(tenantId))) {
    return null;
  }

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerGetById(
        { id },
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
