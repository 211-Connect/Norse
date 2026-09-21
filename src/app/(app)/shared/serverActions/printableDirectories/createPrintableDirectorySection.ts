'use server';

import {
  PrintableDirectoryLocalizedValuesDto,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { printableDirectoriesApiClient } from '@/lib/api/clients';
import { getTenantApiKeyHeaders } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from '../../lib/authHeaders';

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
  const [authHeaders, tenantApiKeyHeaders] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKeyHeaders(tenantId),
  ]);
  const headers = { ...authHeaders, ...tenantApiKeyHeaders };

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
          headers,
          cache: 'no-store',
        },
      );

    const updatedDirectory: PrintableDirectoryResponseDto = response.data;
    return updatedDirectory ?? null;
  } catch {
    return null;
  }
}
