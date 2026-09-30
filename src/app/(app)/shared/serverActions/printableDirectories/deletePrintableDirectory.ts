'use server';

import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function deletePrintableDirectory(
  id: string,
  tenantId: string,
): Promise<boolean> {
  try {
    await printableDirectoriesApiClient.printableDirectoryControllerRemove(
      { id },
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

    return true;
  } catch {
    return false;
  }
}
