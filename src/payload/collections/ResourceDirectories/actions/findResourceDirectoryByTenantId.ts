'use server';

import { defaultLocale } from '@/payload/i18n/locales';
import { ResourceDirectory } from '@/payload/payload-types';
import { TypedLocale } from 'payload';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

export async function findResourceDirectoryByTenantId(
  tenantId: string,
  locale: TypedLocale = defaultLocale,
): Promise<ResourceDirectory | null> {
  const payload = await getPayloadSingleton();
  const {
    docs: [resourceDirectory],
  } = await payload.find({
    collection: 'resource-directories',
    locale,
    where: { tenant: { equals: tenantId } },
    limit: 1,
    pagination: false,
  });

  return resourceDirectory || null;
}
