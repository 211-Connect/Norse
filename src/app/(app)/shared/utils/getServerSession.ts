import { cache } from 'react';
import { parseHost } from './parseHost';
import { findTenantByHost } from '@/payload/collections/Tenants/actions/findTenantByHost';
import { getServerSession } from 'next-auth';
import { createAuthOptions } from '@/auth';
import { headers } from 'next/headers';

const getSession = cache(async () => {
  const headerList = await headers();

  const host = headerList.get('host') || 'localhost';
  const protocol = headerList.get('x-forwarded-proto') || 'http';

  const parsedHost = parseHost(host);
  const tenant = await findTenantByHost(parsedHost);
  const baseUrl = `${protocol}://${host}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}`;

  const authOptions = createAuthOptions({
    baseUrl,
    keycloak: {
      clientSecret: tenant?.auth.keycloakSecret ?? undefined,
      issuer: tenant?.auth.keycloakIssuer ?? undefined,
    },
    secret: tenant?.auth.nextAuthSecret ?? undefined,
  });

  return getServerSession(authOptions);
});

export { getSession };
