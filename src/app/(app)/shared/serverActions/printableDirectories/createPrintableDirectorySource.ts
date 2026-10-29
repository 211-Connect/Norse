'use server';

import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';
import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { toQuerySourceParams } from '../../utils/printableDirectoryQueryParams';
import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';

const toInput = (
  payload: PrintableDirectoryControllerCreateSourcePayload,
): PrintableDirectoryControllerCreateSourcePayload =>
  payload.type === 'query'
    ? {
        ...payload,
        query: {
          title: payload.query.title,
          params: toQuerySourceParams(
            payload.query.params as Record<string, unknown>,
          ),
        },
      }
    : payload;

type CreatePrintableDirectorySourceParams = {
  directoryId: string;
  sectionId: string;
  payload: PrintableDirectoryControllerCreateSourcePayload;
  tenantId: string;
};

export async function createPrintableDirectorySource({
  directoryId,
  sectionId,
  payload,
  tenantId,
}: CreatePrintableDirectorySourceParams): Promise<PrintableDirectoryResponseDto | null> {
  if (!(await getPrintableDirectoryServerAccess(tenantId))) {
    return null;
  }

  try {
    const response =
      await printableDirectoriesApiClient.printableDirectoryControllerCreateSource(
        {
          id: directoryId,
          sectionId,
        },
        toInput(payload),
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
