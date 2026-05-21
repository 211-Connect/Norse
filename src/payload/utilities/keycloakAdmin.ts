function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getKeycloakAdminBaseUrl(): string {
  return requireEnv('KEYCLOAK_BASE_URL').replace(/\/$/, '');
}

export async function getKeycloakAdminAccessToken(): Promise<string> {
  const baseUrl = getKeycloakAdminBaseUrl();
  const clientId = requireEnv('KEYCLOAK_ADMIN_CLIENT_ID');
  const clientSecret = requireEnv('KEYCLOAK_ADMIN_SECRET');

  const tokenEndpoint = `${baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Token request failed (${response.status}): ${bodyText || response.statusText}`,
    );
  }

  const tokenPayload = (await response.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error('Token response did not include access_token');
  }

  return tokenPayload.access_token;
}

export async function getVerifiedEnabledUsersCount(
  realmId: string,
): Promise<number> {
  const baseUrl = getKeycloakAdminBaseUrl();
  const token = await getKeycloakAdminAccessToken();
  const usersCountUrl = `${baseUrl}/admin/realms/${encodeURIComponent(realmId)}/users/count?enabled=true&emailVerified=true`;

  const response = await fetch(usersCountUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Failed to fetch verified users count for realm "${realmId}" (${response.status}): ${bodyText || response.statusText}`,
    );
  }

  const count = (await response.json()) as number;
  return Number.isFinite(count) ? count : 0;
}
