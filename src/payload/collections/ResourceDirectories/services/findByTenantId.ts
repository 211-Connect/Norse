import { defaultLocale } from '@/payload/i18n/locales';
import { ResourceDirectory } from '@/payload/payload-types';
import { Payload, TypedLocale } from 'payload';

export async function findByTenantId(
  payload: Payload,
  tenantId: string,
  locale: TypedLocale = defaultLocale,
): Promise<ResourceDirectory | null> {
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
