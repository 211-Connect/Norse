'use server';

import { UpdatePrintableDirectoryDto } from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';
import { PrintableDirectoryMutationResult } from './printableDirectoryMutationResult';

export async function updatePrintableDirectory(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId: string,
): Promise<PrintableDirectoryMutationResult> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

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
