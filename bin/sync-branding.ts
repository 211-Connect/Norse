#!/usr/bin/env tsx

import 'dotenv/config';

import type { ResourceDirectory, Tenant } from '../src/payload/payload-types';

type TenantDoc = Pick<Tenant, 'id' | 'auth'>;

type ResourceDirectoryDoc = Pick<
  ResourceDirectory,
  'id' | 'tenant' | 'name' | 'brand'
>;

type CollectionResponse<T> = {
  docs: T[];
  hasNextPage?: boolean;
  nextPage?: number;
};

type RealmAttributes = {
  primaryColor: string;
  borderRadius: string;
  title: string;
  logoUrl: string;
};

type PayloadUrls = {
  appBaseUrl: string;
  apiBaseUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getTenantId(doc: ResourceDirectoryDoc): string {
  if (typeof doc.tenant === 'string') {
    return doc.tenant;
  }

  if (doc.tenant && typeof doc.tenant === 'object' && doc.tenant.id) {
    return doc.tenant.id;
  }

  // In this project, resource-directories id is set to tenant id by hook.
  return doc.id;
}

function normalizePayloadUrls(rawUrl: string): PayloadUrls {
  const url = new URL(rawUrl);
  const normalizedPath = url.pathname.replace(/\/+$/, '');

  let appPath = normalizedPath;

  if (appPath.endsWith('/api/users/login')) {
    appPath = appPath.slice(0, -'/api/users/login'.length);
  } else if (appPath === '/api') {
    appPath = '';
  } else if (appPath.endsWith('/api')) {
    appPath = appPath.slice(0, -'/api'.length);
  } else if (appPath === '/admin') {
    appPath = '';
  } else if (appPath.endsWith('/admin')) {
    appPath = appPath.slice(0, -'/admin'.length);
  }

  const appBaseUrl = `${url.origin}${appPath}`.replace(/\/+$/, '');

  return {
    appBaseUrl,
    apiBaseUrl: `${appBaseUrl}/api`,
  };
}

function getResponseSnippet(bodyText: string): string {
  return bodyText.replace(/\s+/g, ' ').trim().slice(0, 160);
}

async function parseJsonResponse<T>(
  response: Response,
  context: string,
): Promise<T> {
  const bodyText = await response.text();
  const contentType = response.headers.get('content-type') || 'unknown';

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(
      `${context} returned non-JSON content from ${response.url} (content-type: ${contentType}). Check PAYLOAD_API_URL. Response starts with: ${getResponseSnippet(bodyText)}`,
    );
  }
}

function resolveLogoUrl(doc: ResourceDirectoryDoc, appBaseUrl: string): string {
  const logo = doc.brand?.logo;

  if (!logo || typeof logo !== 'object' || !('url' in logo) || !logo.url) {
    return '';
  }

  if (/^https?:\/\//i.test(logo.url)) {
    return logo.url;
  }

  return new URL(logo.url, appBaseUrl).toString();
}

function buildBrandingAttributes(
  doc: ResourceDirectoryDoc,
  appBaseUrl: string,
): RealmAttributes {
  return {
    primaryColor: doc.brand?.theme?.primaryColor || '#0b5db3',
    borderRadius: doc.brand?.theme?.borderRadius || '8px',
    title: doc.brand?.meta?.title?.trim() || doc.name?.trim() || 'Sign in',
    logoUrl: resolveLogoUrl(doc, appBaseUrl),
  };
}

async function getKeycloakAccessToken(baseUrl: string): Promise<string> {
  const clientId = requireEnv('KEYCLOAK_ADMIN_CLIENT_ID');
  const clientSecret = requireEnv('KEYCLOAK_ADMIN_SECRET');

  const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Unable to get Keycloak token (${response.status}): ${bodyText || response.statusText}`,
    );
  }

  const payload = await parseJsonResponse<{ access_token?: string }>(
    response,
    'Keycloak token request',
  );

  if (!payload.access_token) {
    throw new Error('Keycloak token response did not include access_token');
  }

  return payload.access_token;
}

async function getPayloadToken(payloadApiUrl: string): Promise<string> {
  const email = requireEnv('PAYLOAD_EMAIL');
  const password = requireEnv('PAYLOAD_PASSWORD');

  const response = await fetch(`${payloadApiUrl}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Payload login failed (${response.status}): ${bodyText || response.statusText}`,
    );
  }

  const data = await parseJsonResponse<{ token?: string }>(
    response,
    'Payload login request',
  );

  if (!data.token) {
    throw new Error('Payload login response did not include a token');
  }

  return data.token;
}

async function fetchAllDocs<T>(url: string, token: string): Promise<T[]> {
  const docs: T[] = [];
  let page = 1;

  while (true) {
    const separator = url.includes('?') ? '&' : '?';
    const pagedUrl = `${url}${separator}page=${page}`;
    const response = await fetch(pagedUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `JWT ${token}`,
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `Payload request failed (${response.status}) for ${pagedUrl}: ${bodyText || response.statusText}`,
      );
    }

    const data = await parseJsonResponse<CollectionResponse<T>>(
      response,
      `Payload request for ${pagedUrl}`,
    );
    docs.push(...(data.docs || []));

    if (!data.hasNextPage) {
      break;
    }

    page = data.nextPage || page + 1;
  }

  return docs;
}

async function updateRealmAttributes(
  baseUrl: string,
  token: string,
  realmId: string,
  attributes: RealmAttributes,
): Promise<void> {
  const realmUrl = `${baseUrl}/admin/realms/${encodeURIComponent(realmId)}`;

  const realmResponse = await fetch(realmUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!realmResponse.ok) {
    const bodyText = await realmResponse.text();
    throw new Error(
      `Failed to fetch realm ${realmId} (${realmResponse.status}): ${bodyText || realmResponse.statusText}`,
    );
  }

  const realmRepresentation = (await realmResponse.json()) as {
    attributes?: Record<string, string | undefined>;
  };

  const updateResponse = await fetch(realmUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...realmRepresentation,
      loginTheme: 'c211-v2',
      emailTheme: 'c211-v2',
      attributes: {
        ...(realmRepresentation.attributes || {}),
        ...attributes,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!updateResponse.ok) {
    const bodyText = await updateResponse.text();
    throw new Error(
      `Failed to update realm ${realmId} (${updateResponse.status}): ${bodyText || updateResponse.statusText}`,
    );
  }
}

async function run(): Promise<void> {
  const payloadUrls = normalizePayloadUrls(requireEnv('PAYLOAD_API_URL'));
  const keycloakBaseUrl = requireEnv('KEYCLOAK_BASE_URL').replace(/\/$/, '');

  const [keycloakToken, payloadToken] = await Promise.all([
    getKeycloakAccessToken(keycloakBaseUrl),
    getPayloadToken(payloadUrls.apiBaseUrl),
  ]);

  // Pull all tenants and resource directories from Payload REST API.
  const [tenants, resourceDirectories] = await Promise.all([
    fetchAllDocs<TenantDoc>(
      `${payloadUrls.apiBaseUrl}/tenants?limit=100&pagination=true&depth=0`,
      payloadToken,
    ),
    fetchAllDocs<ResourceDirectoryDoc>(
      `${payloadUrls.apiBaseUrl}/resource-directories?limit=100&pagination=true&depth=1&locale=en&fallback-locale=en`,
      payloadToken,
    ),
  ]);

  const tenantRealmMap = new Map<string, string>();
  for (const tenant of tenants) {
    if (tenant.id && tenant.auth?.realmId) {
      tenantRealmMap.set(tenant.id, tenant.auth.realmId);
    }
  }

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  for (const resourceDirectory of resourceDirectories) {
    const tenantId = getTenantId(resourceDirectory);
    const realmId = tenantRealmMap.get(tenantId);

    if (!realmId) {
      skippedCount += 1;
      console.warn(
        `[skip] tenant=${tenantId} reason=No matching tenant.auth.realmId`,
      );
      continue;
    }

    const attributes = buildBrandingAttributes(
      resourceDirectory,
      payloadUrls.appBaseUrl,
    );

    try {
      await updateRealmAttributes(
        keycloakBaseUrl,
        keycloakToken,
        realmId,
        attributes,
      );
      successCount += 1;
      console.log(`[ok] realm=${realmId} tenant=${tenantId}`);
    } catch (error) {
      failureCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[fail] realm=${realmId} tenant=${tenantId} error=${message}`,
      );
    }
  }

  console.log(
    `\nBranding sync complete. success=${successCount} failed=${failureCount} skipped=${skippedCount}`,
  );

  if (failureCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[fatal] Branding sync aborted: ${message}`);
  process.exitCode = 1;
});
