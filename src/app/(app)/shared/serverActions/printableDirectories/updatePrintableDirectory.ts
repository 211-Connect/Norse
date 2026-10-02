'use server';

import { UpdatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { PrintableDirectoryMutationResult } from './printableDirectoryMutationResult';

export async function updatePrintableDirectory(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId: string,
): Promise<PrintableDirectoryMutationResult> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdate(
        { id },
        input,
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
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
