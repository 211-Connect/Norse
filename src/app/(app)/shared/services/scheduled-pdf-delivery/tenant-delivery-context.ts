import type { Payload } from 'payload';

import { getNormalizedCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { getAppConfigForHost } from '@/app/(app)/shared/utils/appConfig';
import { AppConfig } from '@/types/appConfig';

import {
  TenantDeliveryContext,
  toAbsoluteUrl,
} from './deliver-printable-directory-pdf';

export type TenantDeliveryContextWithConfig = TenantDeliveryContext & {
  appConfig: Omit<AppConfig, 'baseUrl' | 'sessionId'>;
};

const isLocalHost = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host) ||
  /\.localhost(:\d+)?$/.test(host);

/**
 * Resolves the tenant's branding, locales and printable directory access
 * from one of its domains (`host`, optionally with a port), for use outside
 * a request.
 */
export async function getTenantDeliveryContext(
  payload: Payload,
  host: string,
): Promise<TenantDeliveryContextWithConfig> {
  // Tenant lookup is by hostname (as `getHost()` gives it); links keep the port.
  const appConfig = await getAppConfigForHost(host.split(':')[0], 'en');
  const basePath = getNormalizedCustomBasePath();
  const origin = `${isLocalHost(host) ? 'http' : 'https'}://${host}`;
  const baseUrl = `${origin}${basePath}`;

  return {
    payload,
    appConfig,
    tenantId: appConfig.tenantId,
    baseUrl,
    domain: `${host}${basePath}`,
    brandName: appConfig.brand.name,
    brandLogoUrl: toAbsoluteUrl(appConfig.brand.logoUrl, baseUrl),
    defaultLocale: appConfig.i18n.defaultLocale,
  };
}
