'use server';

import {
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectoryDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

export async function updatePrintableDirectory(
  id: string,
  input: UpdatePrintableDirectoryDto,
  tenantId?: string,
): Promise<PrintableDirectoryResponseDto | null> {
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

    return response.data;
  } catch {
    return null;
  }
}
