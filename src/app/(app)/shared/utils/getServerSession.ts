import { createAuthOptions } from '@/auth';
import { findTenantByHost } from '@/payload/collections/Tenants/actions/findTenantByHost';
import { getKeycloakIssuer } from '@/utils/getKeycloakIssuer';
import { normalizeAllowedEmailDomains } from '@/utils/normalizeAllowedEmailDomains';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { cache } from 'react';

import { withOptionalCustomBasePath } from '../lib/utils';

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
  const baseUrl = withOptionalCustomBasePath(`${protocol}://${host}`);

  const authOptions = createAuthOptions({
    baseUrl,
    keycloak: {
      clientSecret: tenant?.auth.keycloakSecret ?? undefined,
      issuer: getKeycloakIssuer(tenant?.auth?.realmId ?? ''),
    },
    requiresLogin: tenant?.auth?.requiresLogin ?? false,
    allowedEmailDomains: normalizeAllowedEmailDomains(
      tenant?.auth?.allowedEmailDomains,
    ),
    secret: tenant?.auth.nextAuthSecret ?? undefined,
  });

  return getServerSession(authOptions);
}

const getSession = cache(getSessionOrigin);

export { getSession };
