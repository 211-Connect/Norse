import NextAuth, { TokenSet } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  export interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
    };
    accessToken?: string;
    idToken?: string;
    error: string | null;
    expires: string;
  }

  export interface Account extends Partial<TokenSet> {
    access_token: string;
    token_type: string;
    id_token: string;
    refresh_token: string;
    providerAccountId: string;
    userId?: string;
    provider: string;
    type: ProviderType;
  }
}

declare module 'next-auth/jwt' {
  export interface JWT {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    error?: string | null;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
  }
}
