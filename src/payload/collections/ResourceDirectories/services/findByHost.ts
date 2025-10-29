import { ResourceDirectory } from '@/payload/payload-types';
import { getPayload, Payload, TypedLocale } from 'payload';
import config from '@/payload/payload-config';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';
import { byTenantId } from '../cache/tags';
import { locales } from '@/payload/i18n/locales';
import { cache } from 'react';
import { parseHost } from '@/app/(app)/shared/utils/getHost';

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
  'use cache';
  cacheLife('max');

  if (!locales.includes(locale)) {
    return null;
  }

  const payload = await getPayload({ config });
  const resourceDirectory = await findByHost(payload, host, locale);

  const tenantId =
    typeof resourceDirectory?.tenant === 'string'
      ? resourceDirectory.tenant
      : resourceDirectory?.tenant?.id;

  if (tenantId) {
    cacheTag(byTenantId(tenantId));
  }

  return resourceDirectory;
}

export const findByHost = cache(findByHostOrig);
export const findByHostCached = cache(findByHostCachedOrig);
