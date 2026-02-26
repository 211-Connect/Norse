import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { createAuthOptions } from '@/auth';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';
import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';

const handlerFunction = async (req: NextRequest, ctx) => {
  const host =
    process.env.CUSTOM_AUTH_HOST ||
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host');
  const protocol =
    process.env.CUSTOM_AUTH_PROTOCOL ||
    req.headers.get('x-forwarded-proto') ||
    'https';

  const parsedHost = parseHost(host ?? '');

  const baseUrl = `${protocol}://${host}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}`;
  const tenant = await findTenantByHost(parsedHost);

  return NextAuth(
    req,
    ctx,
    createAuthOptions({
      baseUrl,
      keycloak: {
        clientSecret: tenant?.auth.keycloakSecret ?? undefined,
        issuer: tenant?.auth.keycloakIssuer ?? undefined,
      },
      secret: tenant?.auth.nextAuthSecret ?? undefined,
    }),
  );
};

export { handlerFunction as GET, handlerFunction as POST };
