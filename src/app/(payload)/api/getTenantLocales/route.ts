import { findTenantByHost } from '@/payload/collections/Tenants/actions';
import { withRedisCache } from '@/utilities/withRedisCache';
import { TypedLocale } from 'payload';

export type TenantLocaleResponse = {
  enabledLocales: TypedLocale[];
  defaultLocale: string;
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');
  const secret = searchParams.get('secret');

  if (secret !== process.env.PAYLOAD_API_ROUTE_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!host) {
    return new Response('Host query parameter is required', { status: 400 });
  }

  const tenant = await withRedisCache(`tenant_locale:${host}`, async () => {
    const tenant = await findTenantByHost(host);
    return {
      enabledLocales: tenant ? tenant.enabledLocales : [],
      defaultLocale: tenant ? tenant.defaultLocale : 'en',
    };
  });

  if (tenant) {
    return new Response(JSON.stringify(tenant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Tenant not found', { status: 404 });
};
