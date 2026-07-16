'use server';

import {
  CreatePrintableDirectoryDto,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function createPrintableDirectory(
  input: CreatePrintableDirectoryDto,
  tenantId?: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const headers = await getAuthHeaders(tenantId);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreate(
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
