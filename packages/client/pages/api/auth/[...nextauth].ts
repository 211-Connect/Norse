import axios from 'axios';
import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { omitBy, isNil } from 'lodash';

export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user = omitBy(session.user, isNil) as Session['user'];
      if (token.error) {
        session.error = token.error;
      }
      return session;
    },
    async jwt({ token, account }) {
      token = omitBy(token, isNil);

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
          const response = await axios.post(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
            {
              client_id: process.env.KEYCLOAK_CLIENT_ID,
              client_secret: process.env.KEYCLOAK_SECRET,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken,
            },
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );

          return {
            ...token,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresAt: Math.floor(Date.now() / 1000 + response.data.expires_in),
          };
        } catch (err: any) {
          if (axios.isAxiosError(err)) {
            console.error(
              'Error refreshing access token :',
              err.response?.data
            );
          }

          token.error = 'RefreshAccessTokenError';
          return token;
        }
      }
    },
  },
  events: {
    signOut: async (message) => {
      await axios.post(
        `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
        {
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_SECRET,
          refresh_token: message.token.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    },
  },
  providers: [
    KeycloakProvider({
      clientId: process.env?.KEYCLOAK_CLIENT_ID ?? '',
      clientSecret: process.env?.KEYCLOAK_SECRET ?? '',
      issuer: process.env.KEYCLOAK_ISSUER,
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
};

export default NextAuth(authOptions);
