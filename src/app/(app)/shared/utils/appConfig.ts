import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { cmsRequest } from '@/lib/cms/client';
import { isCmsRemote } from '@/lib/cms/config';
import { isValidLocale } from '@/payload/i18n/locales';
import { AppConfig } from '@/types/appConfig';
import { ONE_HOUR, withCache } from '@/utilities/withCache';

import { SESSION_ID } from '../lib/constants';
import type { CachedAppConfig } from './buildAppConfig';
import { getHost } from './getHost';
import { parseHost } from './parseHost';

export type { CachedAppConfig };

/**
 * The tenant's app config: built by the CMS (`buildAppConfig`), cached in
 * memory and Redis under `app_config:<host>:<locale>` (deleted by the CMS's
 * `revalidateCache` hooks on save), plus the per-request `baseUrl` and
 * `sessionId`.
 */
async function fetchAppConfig(
  host: string,
  locale: string,
): Promise<CachedAppConfig> {
  // `NORSE_BUILD` is inlined at build time: the public app's build drops
  // this branch and never bundles Payload.
  if (process.env.NORSE_BUILD !== 'app') {
    if (!isCmsRemote()) {
      const { buildAppConfig } = await import('./buildAppConfig');
      return buildAppConfig(host, locale);
    }
  }

  return cmsRequest<CachedAppConfig>('app-config', {
    query: { host, locale },
  });
}

export const getAppConfig = cache(async function (
  host: string,
  locale: string,
): Promise<AppConfig> {
  const cachedAppConfig = await getCachedAppConfig(host, locale);
  const { host: domain, protocol } = await getHost();
  const cookieList = await cookies();

  return {
    ...cachedAppConfig,
    baseUrl: `${protocol}://${domain}`,
    sessionId: cookieList.get(SESSION_ID)?.value || '',
  };
});

const getCachedAppConfig = cache(async function (
  host: string,
  locale: string,
): Promise<CachedAppConfig> {
  // A first path segment that is not a locale (`/admin` in the public app's
  // build, which has no Payload routes) is a 404, not a CMS lookup.
  if (!isValidLocale(locale)) notFound();

  const domain = parseHost(host);
  const cached = await withCache(
    `app_config:${domain}:${locale}`,
    () => fetchAppConfig(host, locale),
    { redis: true, memory: true, ttl: ONE_HOUR },
  );

  if (!cached) {
    throw new Error(
      `Failed to resolve cached app config for ${host}:${locale}`,
    );
  }

  return cached;
});

/**
 * The app config for a tenant host outside a request (no cookies or request
 * headers), e.g. in Payload jobs. `baseUrl` and `sessionId` are not set.
 */
export const getAppConfigForHost = (
  host: string,
  locale: string,
): Promise<CachedAppConfig> => getCachedAppConfig(host, locale);

export const getAppConfigWithoutHost = async (locale: string) => {
  const { host } = await getHost();
  return getAppConfig(host, locale);
};
