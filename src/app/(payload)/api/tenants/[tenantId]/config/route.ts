import { getAppConfig } from '@/app/(app)/shared/utils/appConfig';
import { createLogger } from '@/lib/logger';
import { findTenantById } from '@/payload/collections/Tenants/actions';
import { defaultLocale, isValidLocale } from '@/payload/i18n/locales';

const log = createLogger('tenant-config');
const CDN_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=59';

/**
 * Currently this endpoint is protected by a static API key,
 * but in the future we may want to implement more dynamic approach with API key per tenant.
 */
function isAuthorized(request: Request): boolean {
  const expectedApiKey = process.env.PAYLOAD_APP_CONFIG_API_KEY;
  if (!expectedApiKey) {
    return false;
  }

  const authorizationHeader = request.headers.get('authorization');
  if (!authorizationHeader) {
    return false;
  }

  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : authorizationHeader;

  return token === expectedApiKey;
}

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) => {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { tenantId } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? defaultLocale;

  if (!isValidLocale(locale)) {
    return new Response('Invalid locale', { status: 400 });
  }

  try {
    const tenant = await findTenantById(tenantId);
    const domain = tenant?.trustedDomains?.[0]?.domain;

    if (!domain) {
      return new Response('Tenant or resource directory not found', {
        status: 404,
      });
    }

    const appConfig = await getAppConfig(domain, locale);

    if (!appConfig) {
      return new Response('Tenant or resource directory not found', {
        status: 404,
      });
    }

    return new Response(JSON.stringify(appConfig), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': CDN_CACHE_CONTROL,
      },
    });
  } catch (error) {
    log.error(
      { err: error, tenantId, locale },
      'Error while fetching tenant app config',
    );
    return new Response('Internal server error', { status: 500 });
  }
};
