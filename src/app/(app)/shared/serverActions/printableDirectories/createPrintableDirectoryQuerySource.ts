'use server';

import { createPrintableDirectorySource } from './createPrintableDirectorySource';

type CreatePrintableDirectoryQuerySourceParams = {
  directoryId: string;
  sectionId: string;
  title?: string;
  queryParams: Record<string, unknown>;
  tenantId?: string;
};

export async function createPrintableDirectoryQuerySource({
  directoryId,
  sectionId,
  title,
  queryParams,
  tenantId,
}: CreatePrintableDirectoryQuerySourceParams): Promise<boolean> {
  const updated = await createPrintableDirectorySource({
    directoryId,
    sectionId,
    payload: {
      type: 'query',
      query: {
        title,
        params: queryParams,
      },
    },
    tenantId,
  });

  return Boolean(updated);
}
