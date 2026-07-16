'use server';

import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';

import { getAuthHeaders } from '../../lib/authHeaders';

type CreatePrintableDirectorySourceParams = {
  directoryId: string;
  sectionId: string;
  payload: PrintableDirectoryControllerCreateSourcePayload;
  tenantId?: string;
};

export async function createPrintableDirectorySource({
  directoryId,
  sectionId,
  payload,
  tenantId,
}: CreatePrintableDirectorySourceParams): Promise<PrintableDirectoryResponseDto | null> {
  const headers = await getAuthHeaders(tenantId);

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreateSource(
        {
          id: directoryId,
          sectionId,
        },
        payload,
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
