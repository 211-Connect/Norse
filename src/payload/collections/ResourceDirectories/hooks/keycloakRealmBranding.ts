import { createLogger } from '@/lib/logger';
import {
  getKeycloakAdminAccessToken,
  getKeycloakAdminBaseUrl,
} from '@/payload/utilities/keycloakAdmin';

export type KeycloakRealmBrandingAttributes = {
  primaryColor: string;
  borderRadius: string;
  title: string;
  logoUrl: string;
};

const log = createLogger('syncKeycloakRealmBrandingAttributes');

export async function syncKeycloakRealmBrandingAttributes(
  realmId: string,
  attributes: KeycloakRealmBrandingAttributes,
): Promise<void> {
  const baseUrl = getKeycloakAdminBaseUrl();
  const token = await getKeycloakAdminAccessToken();

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
