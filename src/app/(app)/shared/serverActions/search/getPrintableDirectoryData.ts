'use server';

import { getResources } from '@/app/(app)/shared/services/resource-service';
import { resourcesToPrintableDirectory } from '@/app/(app)/shared/utils/printable-directory-transformers';

export async function getPrintableDirectoryData(
  resourceIds: string[],
  locale: string,
  tenantId: string | undefined,
  listName: string,
) {
  const uniqueIds = [...new Set(resourceIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return { name: listName, items: [] };
  }

  const resources = await getResources(uniqueIds, locale, tenantId);
  return resourcesToPrintableDirectory(resources, locale, listName);
}
