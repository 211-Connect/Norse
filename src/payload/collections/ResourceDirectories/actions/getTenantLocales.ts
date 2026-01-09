'use server';

import { getPayload } from 'payload';
import config from '@/payload/payload-config';

export async function getTenantLocales(
  resourceDirectoryId: string,
): Promise<string[]> {
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
