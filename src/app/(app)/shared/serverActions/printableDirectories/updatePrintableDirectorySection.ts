'use server';

import {
  PrintableDirectoryControllerUpdateSectionParams,
  PrintableDirectoryResponseDto,
  UpdatePrintableDirectorySectionDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

export async function updatePrintableDirectorySection(
  params: PrintableDirectoryControllerUpdateSectionParams,
  input: UpdatePrintableDirectorySectionDto,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerUpdateSection(
        params,
        input,
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
