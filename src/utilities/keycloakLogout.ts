import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';

export interface KeycloakLogoutParams {
  issuer: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/**
 * Revokes the Keycloak refresh token on sign-out. Kept out of `auth.ts` so the
 * dependency operation it records can be asserted without booting NextAuth.
 */
export async function revokeKeycloakRefreshToken({
  issuer,
  clientId,
  clientSecret,
  refreshToken,
}: KeycloakLogoutParams): Promise<void> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  await fetchWrapper(`${issuer}/protocol/openid-connect/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    parseResponse: false,
    telemetry: { dependency: 'keycloak', operation: 'logout' },
  });
}
