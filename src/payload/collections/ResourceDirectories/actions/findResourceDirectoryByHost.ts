import { ResourceDirectory } from '@/payload/payload-types';
import { getPayload, TypedLocale } from 'payload';
import { locales } from '@/payload/i18n/locales';
import { cache } from 'react';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { withRedisCache } from '@/payload/utilities';
import config from '@/payload/payload-config';

async function findResourceDirectoryByHostOrig(
  host: string,
  locale: TypedLocale,
): Promise<ResourceDirectory | null> {
  const payload = await getPayload({ config });
  const domain = parseHost(host);

  payload.logger.debug('findResourceDirectoryByHost', { domain });

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
        { 'tenant.enabledLocales': { contains: locale } },
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

async function findResourceDirectoryByHostCachedOrig(
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

export const findResourceDirectoryByHost = cache(
  findResourceDirectoryByHostCachedOrig,
);
