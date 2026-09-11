'use server';

import {
  PrintableDirectoryControllerUpdateSectionParams,
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectorySectionDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function updatePrintableDirectorySection(
  params: PrintableDirectoryControllerUpdateSectionParams,
  input: UpdatePrintableDirectorySectionDto,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdateSection(
        params,
        input,
        {
          headers,
          cache: 'no-store',
        },
      );

    return response.data;
  } catch {
    return null;
  }
}
