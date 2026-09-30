'use server';

import {
  PrintableDirectoryLocalizedValuesDto,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

type CreatePrintableDirectorySectionInput = {
  headingLocalized: PrintableDirectoryLocalizedValuesDto;
  descriptionLocalized: PrintableDirectoryLocalizedValuesDto;
  maxResources?: number;
};

export async function createPrintableDirectorySection(
  directoryId: string,
  input: string | CreatePrintableDirectorySectionInput,
  tenantId: string,
): Promise<PrintableDirectoryResponseDto | null> {
  const payload: CreatePrintableDirectorySectionInput =
    typeof input === 'string'
      ? {
          headingLocalized: { values: { en: input } },
          descriptionLocalized: { values: {} },
        }
      : input;

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreateSection(
        { id: directoryId },
        payload,
        {
          cache: 'no-store',
          headers: await getApiHeaders(tenantId, 'en', true),
        },
      );

    const updatedDirectory: PrintableDirectoryResponseDto = response.data;
    return updatedDirectory ?? null;
  } catch {
    return null;
  }
}
