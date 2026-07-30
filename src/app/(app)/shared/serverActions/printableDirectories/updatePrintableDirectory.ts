'use server';

import { UpdatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';
import { PrintableDirectoryMutationResult } from './printableDirectoryMutationResult';

export async function updatePrintableDirectory(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId?: string,
): Promise<PrintableDirectoryMutationResult> {
  const headers = await getAuthHeaders(tenantId);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdate(
        { id },
        input,
        {
          headers,
          cache: 'no-store',
        },
      );

    if (!response.ok) {
      return {
        success: false,
        error: response.status === 409 ? 'slug_taken' : 'unknown',
      };
    }

    return { success: true, data: response.data };
  } catch {
    return { success: false, error: 'unknown' };
  }
}
