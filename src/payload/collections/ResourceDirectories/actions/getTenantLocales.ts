'use server';

import { getPayload } from 'payload';

export async function getTenantLocales(
  resourceDirectoryId: string,
): Promise<string[]> {
  const config = (await import('@/payload/payload-config')).default;
  const payload = await getPayload({ config });

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
