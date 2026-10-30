import { cmsOnly, isInternalRequest } from '@/lib/cms/internal-route';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';
import { withCache } from '@/utilities/withCache';
import { normalizeAllowedEmailDomains } from '@/utils/normalizeAllowedEmailDomains';

export const GET = cmsOnly(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');

  if (!isInternalRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!host) {
    return new Response('Host query parameter is required', { status: 400 });
  }

  const tenantBasicConfig = await withCache(
    `tenant_basic_config:${host}`,
    async () => {
      const tenant = await findTenantByHost(host);

      return {
        enabledLocales: tenant ? tenant.enabledLocales : [],
        defaultLocale: tenant ? tenant.defaultLocale : 'en',
        auth: {
          requiresLogin: tenant?.auth?.requiresLogin ?? false,
          allowedEmailDomains: normalizeAllowedEmailDomains(
            tenant?.auth?.allowedEmailDomains,
          ),
          publicPages: tenant?.auth?.publicPages ?? [],
        },
        seo: {
          noindex: tenant?.seo?.noindex ?? false,
        },
      };
    },
    { redis: true, memory: true },
  );

  if (tenantBasicConfig) {
    return new Response(JSON.stringify(tenantBasicConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Tenant not found', { status: 404 });
});
