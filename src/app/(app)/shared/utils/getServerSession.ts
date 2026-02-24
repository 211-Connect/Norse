import { parseHost } from './parseHost';
import { findTenantByHost } from '@/payload/collections/Tenants/actions/findTenantByHost';
import { getServerSession } from 'next-auth';
import { createAuthOptions } from '@/auth';
import { headers } from 'next/headers';
import { cache } from 'react';

async function getSessionOrigin() {
  const headerList = await headers();

  const host =
    process.env.CUSTOM_AUTH_HOST ||
    headerList.get('x-forwarded-host') ||
    headerList.get('host') ||
    'localhost';
  const protocol =
    process.env.CUSTOM_AUTH_PROTOCOL ||
    headerList.get('x-forwarded-proto') ||
    'https';

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
}

const getSession = cache(getSessionOrigin);

export { getSession };
