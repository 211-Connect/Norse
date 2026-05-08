import { getServerSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';

import { Tenant } from './payload/payload-types';
import { fetchWrapper } from './app/(app)/shared/lib/fetchWrapper';
import { isJwtExpired } from './utils/isJwtExpired';
import { createLogger } from './lib/logger';
import { normalizeAllowedEmailDomains } from './utils/normalizeAllowedEmailDomains';
import { getKeycloakIssuer } from './utils/getKeycloakIssuer';
import { withOptionalCustomBasePath } from './app/(app)/shared/lib/utils';

const log = createLogger('auth');
const isDebug = process.env.NEXTAUTH_DEBUG === 'true';

function normalizeRelativeRedirect(url: string, basePath: string): string {
  if (!basePath || url === basePath || url.startsWith(`${basePath}/`)) {
    return url;
  }

  if (!url.startsWith('/')) {
    return `${basePath}/${url}`;
  }

  return `${basePath}${url}`;
}

export interface CreateAuthOptionsProps {
  baseUrl?: string;
  keycloak?: {
    issuer?: string;
    clientSecret?: string;
  };
  requiresLogin?: boolean;
  allowedEmailDomains?: string[];
  secret?: string;
}

const createAuthOptions = ({
  baseUrl,
  keycloak,
  requiresLogin,
  allowedEmailDomains,
  secret,
}: CreateAuthOptionsProps): NextAuthOptions => ({
  callbacks: {
    async redirect({ url, baseUrl: _baseUrl }) {
      const effectiveBaseUrl = baseUrl ?? _baseUrl;

      const resolvedBaseUrl = new URL(effectiveBaseUrl);
      const basePath =
        resolvedBaseUrl.pathname === '/' ? '' : resolvedBaseUrl.pathname;

      if (url.startsWith('/')) {
        const normalizedUrl = normalizeRelativeRedirect(url, basePath);
        return `${resolvedBaseUrl.origin}${normalizedUrl}`;
      }

      try {
        const resolvedUrl = new URL(url);

        if (resolvedUrl.origin !== resolvedBaseUrl.origin) {
          return effectiveBaseUrl;
        }

        if (
          basePath &&
          resolvedUrl.pathname !== basePath &&
          !resolvedUrl.pathname.startsWith(`${basePath}/`)
        ) {
          resolvedUrl.pathname = normalizeRelativeRedirect(
            resolvedUrl.pathname,
            basePath,
          );
        }

        return resolvedUrl.toString();
      } catch {
        return effectiveBaseUrl;
      }
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error ?? null;

      return session;
    },
    async signIn({ user }) {
      if (!requiresLogin) {
        return true;
      }

      if (!allowedEmailDomains?.length) {
        return true;
      }

      const email = user?.email?.trim().toLowerCase();
      if (!email) {
        return false;
      }

      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) {
        return false;
      }

      const allowedDomainSet = new Set(
        allowedEmailDomains.map((value) => value.toLowerCase()),
      );

      return allowedDomainSet.has(domain);
    },
    async jwt({ token, account }) {
      const tokens = {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
      };

      if (account) {
        // Initial sign in - only store necessary fields to minimize attack surface
        // Explicitly avoid spreading all OIDC claims (e.g., nonce) into JWT
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      const REFRESH_BUFFER = 60;
      if (
        token.expiresAt &&
        Date.now() / 1000 < token.expiresAt - REFRESH_BUFFER
      ) {
        return token;
      }

      if (!token.refreshToken) {
        return {
          ...tokens,
          error: 'NoRefreshToken',
        };
      }

      if (isJwtExpired(token.refreshToken)) {
        log.warn('Refresh token has expired');
        return {
          ...tokens,
          error: 'RefreshTokenExpired',
        };
      }

      try {
        const params = new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID || '',
          client_secret: keycloak?.clientSecret || '',
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        });

        const data = await fetchWrapper(
          `${keycloak?.issuer}/protocol/openid-connect/token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
          },
        );

        if (!data) {
          throw new Error('Token refresh failed: no response');
        }

        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000 + data.expires_in),
          error: undefined,
        };
      } catch (err: any) {
        log.error({ err }, 'Error refreshing access token');

        if (
          err.response?.status === 400 ||
          err.response?.data?.error === 'invalid_grant'
        ) {
          log.warn('Refresh token is invalid or expired');
          return {
            ...tokens,
            error: 'RefreshTokenExpired',
          };
        }

        return {
          ...tokens,
          error: 'RefreshAccessTokenError',
        };
      }
    },
  },
  events: {
    signOut: async (message) => {
      if (!keycloak?.issuer) {
        log.error('Keycloak issuer not configured');
        return;
      }

      if (!message.token?.refreshToken) {
        log.error('No refresh token available for logout');
        return;
      }

      try {
        const params = new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID || '',
          client_secret: keycloak?.clientSecret || '',
          refresh_token: String(message.token.refreshToken),
        });

        await fetchWrapper(
          `${keycloak?.issuer}/protocol/openid-connect/logout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            parseResponse: false,
          },
        );
      } catch (err) {
        log.error({ err }, 'Error during Keycloak logout');
        // Don't throw - allow NextAuth signOut to complete
      }
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
    error: withOptionalCustomBasePath('/auth/error'),
    newUser: withOptionalCustomBasePath('/auth/new-user'),
    signIn: withOptionalCustomBasePath('/auth/signin'),
    signOut: withOptionalCustomBasePath('/auth/sign-out'),
    verifyRequest: withOptionalCustomBasePath('/auth/verify-request'),
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret,
  ...(isDebug && {
    debug: true,
    logger: {
      error(code, metadata) {
        log.error({ code, metadata }, 'NextAuth error');
      },
      warn(code) {
        log.warn({ code }, 'NextAuth warning');
      },
      debug(code, metadata) {
        log.debug({ code, metadata }, 'NextAuth debug');
      },
    },
  }),
});

const getSession = (
  protocol: string,
  host: string,
  authConfig?: Tenant['auth'],
) => {
  const baseUrl = withOptionalCustomBasePath(`${protocol}://${host}`);

  const authOptions = createAuthOptions({
    baseUrl,
    keycloak: {
      clientSecret: authConfig?.keycloakSecret ?? undefined,
      issuer: getKeycloakIssuer(authConfig?.realmId ?? ''),
    },
    requiresLogin: authConfig?.requiresLogin ?? false,
    allowedEmailDomains: normalizeAllowedEmailDomains(
      authConfig?.allowedEmailDomains,
    ),
    secret: authConfig?.nextAuthSecret ?? undefined,
  });

  return getServerSession(authOptions);
};

export { createAuthOptions, getSession };
