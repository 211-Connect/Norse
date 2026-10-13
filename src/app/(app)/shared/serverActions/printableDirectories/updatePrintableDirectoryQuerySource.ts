'use server';

import { getApiHeaders, printableDirectoriesApiClient } from '@/lib/api';

import { getPrintableDirectoryServerAccess } from '../../utils/printableDirectoryServerAccess';

type UpdatePrintableDirectoryQuerySourceParams = {
  directoryId: string;
  sectionId: string;
  sourceId: string;
  title?: string;
  queryParams: Record<string, unknown>;
  tenantId: string;
};

export async function updatePrintableDirectoryQuerySource({
  directoryId,
  sectionId,
  sourceId,
  title,
  queryParams,
  tenantId,
}: UpdatePrintableDirectoryQuerySourceParams): Promise<boolean> {
  if (!(await getPrintableDirectoryServerAccess(tenantId))) {
    return false;
  }

  try {
    await printableDirectoriesApiClient.printableDirectoryControllerUpdateSource(
      {
        id: directoryId,
        sectionId,
        sourceId,
      },
      {
        type: 'query',
        query: {
          title,
          params: queryParams,
        },
      },
      {
        cache: 'no-store',
        headers: await getApiHeaders(tenantId, 'en', true),
      },
    );

    return true;
  } catch {
    return false;
  }
}
