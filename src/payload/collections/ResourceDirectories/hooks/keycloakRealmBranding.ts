import { createLogger } from '@/lib/logger';

export type KeycloakRealmBrandingAttributes = {
  primaryColor: string;
  borderRadius: string;
  title: string;
  logoUrl: string;
};

const log = createLogger('syncKeycloakRealmBrandingAttributes');

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getKeycloakAccessToken(): Promise<string> {
  const keycloakBaseUrl = requireEnv('KEYCLOAK_BASE_URL');
  const clientId = requireEnv('KEYCLOAK_CLIENT_ID');
  const clientSecret = requireEnv('KEYCLOAK_CLIENT_SECRET');

  const tokenEndpoint = `${keycloakBaseUrl.replace(/\/$/, '')}/realms/master/protocol/openid-connect/token`;
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

export async function syncKeycloakRealmBrandingAttributes(
  realmId: string,
  attributes: KeycloakRealmBrandingAttributes,
): Promise<void> {
  const keycloakBaseUrl = requireEnv('KEYCLOAK_BASE_URL');
  const baseUrl = keycloakBaseUrl.replace(/\/$/, '');
  const token = await getKeycloakAccessToken();

  const realmUrl = `${baseUrl}/admin/realms/${encodeURIComponent(realmId)}`;

  const realmResponse = await fetch(realmUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!realmResponse.ok) {
    const bodyText = await realmResponse.text();
    throw new Error(
      `Failed to fetch realm "${realmId}" (${realmResponse.status}): ${bodyText || realmResponse.statusText}`,
    );
  }

  const realmRepresentation = (await realmResponse.json()) as {
    attributes?: Record<string, string | undefined>;
  };

  const mergedAttributes = {
    ...(realmRepresentation.attributes || {}),
    ...attributes,
  };

  const updateResponse = await fetch(realmUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...realmRepresentation,
      attributes: mergedAttributes,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!updateResponse.ok) {
    const bodyText = await updateResponse.text();
    throw new Error(
      `Failed to update realm "${realmId}" (${updateResponse.status}): ${bodyText || updateResponse.statusText}`,
    );
  }

  log.info({ realmId }, 'Keycloak realm branding attributes updated');
}
