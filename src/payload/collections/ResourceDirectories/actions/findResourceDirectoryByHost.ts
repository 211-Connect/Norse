import { ResourceDirectory } from '@/payload/payload-types';
import { TypedLocale } from 'payload';
import { locales } from '@/payload/i18n/locales';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { withRedisCache } from '@/utilities/withRedisCache';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

async function findResourceDirectoryByHostOrig(
  host: string,
  locale: TypedLocale,
): Promise<ResourceDirectory | null> {
  const payload = await getPayloadSingleton();
  const domain = parseHost(host);

  const {
    docs: [resourceDirectory],
  } = await payload.find({
    collection: 'resource-directories',
    locale,
    depth: 1,
    where: {
      and: [
        { 'tenant.trustedDomains.domain': { equals: domain } },
        { 'tenant.services.resourceDirectory': { equals: true } },
        { 'tenant.enabledLocales': { equals: locale } },
      ],
    },
    limit: 1,
    pagination: false,
  });

  if (!resourceDirectory) {
    return null;
  }

  return resourceDirectory;
}

export async function findResourceDirectoryByHost(
  host: string,
  locale: TypedLocale,
  disableCache = false,
): Promise<ResourceDirectory | null> {
  if (!locales.includes(locale)) {
    return null;
  }

  const domain = parseHost(host);

  if (disableCache) {
    return await findResourceDirectoryByHostOrig(host, locale);
  }

  return await withRedisCache(`resource_directory:${domain}:${locale}`, () =>
    findResourceDirectoryByHostOrig(host, locale),
  );
}
