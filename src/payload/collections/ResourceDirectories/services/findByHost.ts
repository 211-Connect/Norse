import { ResourceDirectory } from '@/payload/payload-types';
import { getPayload, Payload, TypedLocale } from 'payload';
import config from '@/payload/payload-config';
import { locales } from '@/payload/i18n/locales';
import { cache } from 'react';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { cacheService } from '@/cacheService';
import { createCacheKey } from '../cache/keys';

async function findByHostOrig(
  payload: Payload,
  host: string,
  locale: TypedLocale,
): Promise<ResourceDirectory | null> {
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
        {
          'tenant.trustedDomains.domain': {
            equals: domain,
          },
        },
        {
          'tenant.services.resourceDirectory': {
            equals: true,
          },
        },
        {
          'tenant.enabledLocales': {
            contains: locale,
          },
        },
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

async function findByHostCachedOrig(
  host: string,
  locale: TypedLocale,
): Promise<ResourceDirectory | null> {
  if (!locales.includes(locale)) {
    return null;
  }

  const cacheServiceInstance = cacheService();

  const domain = parseHost(host);
  const cacheKey = createCacheKey(locale, domain);
  try {
    const cachedData = await cacheServiceInstance.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as ResourceDirectory;
    }
  } catch {}

  const payload = await getPayload({ config });
  const resourceDirectory = await findByHost(payload, host, locale);

  try {
    if (resourceDirectory) {
      await cacheServiceInstance.set(
        cacheKey,
        JSON.stringify(resourceDirectory),
      );
    }
  } catch {}

  return resourceDirectory;
}

export const findByHost = cache(findByHostOrig);
export const findByHostCached = cache(findByHostCachedOrig);
