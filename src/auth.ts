import { getServerSession, NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';

import { Tenant } from './payload/payload-types';
import { fetchWrapper } from './app/(app)/shared/lib/fetchWrapper';

const maskValue = (value: string) => {
  if (!value || value.length <= 8) return '***';
  return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
};

// Helper to remove null/undefined values from object
const omitNilValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null),
  ) as Partial<T>;
};

const isDebug = process.env.NEXTAUTH_DEBUG === 'true';

export interface CreateAuthOptionsProps {
  baseUrl?: string;
  keycloak?: {
    issuer?: string;
    clientSecret?: string;
  };
  secret?: string;
}

const createAuthOptions = ({
  baseUrl,
  keycloak,
  secret,
}: CreateAuthOptionsProps): NextAuthOptions => ({
  callbacks: {
    async redirect({ url, baseUrl: _baseUrl }) {
      if (!baseUrl) return _baseUrl;

      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user = omitNilValues(session.user) as Session['user'];
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account }) {
      token = omitNilValues(token);

      if (account) {
        // Initial sign in
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      } else if (Date.now() < (token?.expiresAt ?? 0) * 1000) {
        // Token is still valid
        return token;
      } else {
        // Token expired. Refresh it.
        try {
          const data = await fetchWrapper(
            `${keycloak?.issuer}/protocol/openid-connect/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: {
                client_id: process.env.KEYCLOAK_CLIENT_ID || '',
                client_secret: keycloak?.clientSecret || '',
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken as string,
              },
            },
          );

          console.log(
            'Refreshed access token successfully for issuer:',
            keycloak?.issuer,
          );

          return {
            ...token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
          };
        } catch (err: any) {
          console.error('Error refreshing access token:', err);
          console.log(`Error refreshing access token: ${keycloak?.issuer}`, {
            client_id: process.env.KEYCLOAK_CLIENT_ID || '',
            client_secret: maskValue(keycloak?.clientSecret || ''),
            grant_type: 'refresh_token',
            refresh_token: maskValue(token.refreshToken as string),
          });

          token.error = 'RefreshAccessTokenError';
          return token;
        }
      }
    },
  },
  events: {
    signOut: async (message) => {
      await fetchWrapper(`${keycloak?.issuer}/protocol/openid-connect/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          client_id: process.env.KEYCLOAK_CLIENT_ID || '',
          client_secret: keycloak?.clientSecret || '',
          refresh_token: message.token.refreshToken as string,
        },
        parseResponse: false,
      });
    },
  },
  providers: [
    KeycloakProvider({
      authorization: {
        params: {
          redirect_uri: `${baseUrl}/api/auth/callback/keycloak`,
        },
      },
      clientId: process.env?.KEYCLOAK_CLIENT_ID ?? '',
      clientSecret: keycloak?.clientSecret ?? '',
      issuer: keycloak?.issuer,
    }),
    // TODO :: Implement custom Keycloak integration so we can have integrated signup/signout pages
    CredentialsProvider({
      name: 'CustomKeycloak',
      credentials: {
        email: {
          label: 'email',
          type: 'email',
          placeholder: 'hello world',
        },
      },
      async authorize(_credentials, _req) {
        throw new Error('Not implemented yet.');
      },
    }),
  ],
  pages: {
    error: `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/error`,
    newUser: `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/new-user`,
    signIn: `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/sign-in`,
    signOut: `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/sign-out`,
    verifyRequest: `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/verify-request`,
  },
  secret,
  ...(isDebug && {
    debug: true,
    logger: {
      error(code, metadata) {
        console.error('[NextAuth][error]', code, metadata);
      },
      warn(code) {
        console.warn('[NextAuth][warn]', code);
      },
      debug(code, metadata) {
        console.debug('[NextAuth][debug]', code, metadata);
      },
    },
  }),
});

const getSession = (
  protocol: string,
  host: string,
  authConfig?: Tenant['auth'],
) => {
  const baseUrl = `${protocol}://${host}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}`;

  const authOptions = createAuthOptions({
    baseUrl,
    keycloak: {
      clientSecret: authConfig?.keycloakSecret ?? undefined,
      issuer: authConfig?.keycloakIssuer ?? undefined,
    },
    secret: authConfig?.nextAuthSecret ?? undefined,
  });

  return getServerSession(authOptions);
};

export { createAuthOptions, getSession };
