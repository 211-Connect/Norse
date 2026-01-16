'use server';

import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function getTenantLocales(
  resourceDirectoryId: string,
): Promise<string[]> {
  const payload = await getPayloadSingleton();

  const resourceDirectory = await payload.findByID({
    collection: 'resource-directories',
    id: resourceDirectoryId,
    locale: 'en',
  });

  const tenant = resourceDirectory.tenant;

  if (typeof tenant === 'string' || !tenant) {
    return [];
  }

  return tenant.enabledLocales;
}
