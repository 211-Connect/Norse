'use server';

import { defaultLocale } from '@/payload/i18n/locales';
import config from '@/payload/payload-config';
import { ResourceDirectory } from '@/payload/payload-types';
import { getPayload, TypedLocale } from 'payload';

export async function findResourceDirectoryByTenantId(
  tenantId: string,
  locale: TypedLocale = defaultLocale,
): Promise<ResourceDirectory | null> {
  const payload = await getPayload({ config });
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
