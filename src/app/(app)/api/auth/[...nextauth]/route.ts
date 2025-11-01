import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { createAuthOptions } from '@/auth';
import { findByHost } from '@/payload/collections/Tenants/services/findByHost';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';

const handlerFunction = async (req: NextApiRequest, res: NextApiResponse) => {
  const headers = req.headers as unknown as Headers;
  const host = headers.get('host');
  const protocol = headers.get('x-forwarded-proto') || 'http';

  const parsedHost = parseHost(host ?? '');

  const baseUrl = `${protocol}://${host}`;
  const tenant = await findByHost(parsedHost);

  return NextAuth(
    req,
    res,
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
