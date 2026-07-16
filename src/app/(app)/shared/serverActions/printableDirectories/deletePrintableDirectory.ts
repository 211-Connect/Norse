'use server';

import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function deletePrintableDirectory(
  id: string,
  tenantId?: string,
): Promise<boolean> {
  const headers = await getAuthHeaders(tenantId);

  try {
    await printableDirectoriesApiClient.printableDirectoryControllerRemove(
      { id },
      {
        headers,
        cache: 'no-store',
      },
    );

    return true;
  } catch {
    return false;
  }
}
