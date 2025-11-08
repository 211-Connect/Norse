import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { createAuthOptions } from '@/auth';
import { findByHost } from '@/payload/collections/Tenants/services/findByHost';
import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';

const handlerFunction = async (req: NextRequest) => {
  const headers = req.headers as unknown as Headers;
  const host = headers.get('host');
  const protocol = headers.get('x-forwarded-proto') || 'http';

  const parsedHost = parseHost(host ?? '');

  const baseUrl = `${protocol}://${host}`;
  const tenant = await findByHost(parsedHost);

  return NextAuth(
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
