import type { BasePayload, PayloadRequest } from 'payload';

import { createLogger } from '@/lib/logger';
import type { ResourceDirectory, TenantMedia } from '@/payload/payload-types';

import { syncKeycloakRealmBrandingAttributes } from './keycloakRealmBranding';

const log = createLogger('syncKeycloakRealmBranding');

function asLocalizedString(
  value: string | Record<string, string | null> | null | undefined,
): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const english = value.en;
  if (typeof english === 'string' && english.trim()) {
    return english.trim();
  }

  const firstValue = Object.values(value).find(
    (entry): entry is string =>
      typeof entry === 'string' && entry.trim().length > 0,
  );

  return firstValue?.trim() || '';
}

function toAbsoluteUrl(urlValue: string | null | undefined): string {
  if (!urlValue) {
    return '';
  }

  if (/^https?:\/\//i.test(urlValue)) {
    return urlValue;
  }

  const payloadApiUrl = process.env.PAYLOAD_API_URL;

  if (!payloadApiUrl) {
    return urlValue;
  }

  return new URL(urlValue, payloadApiUrl).toString();
}

async function resolveTenantMediaUrl(
  payload: BasePayload,
  media: number | TenantMedia | null | undefined,
): Promise<string> {
  if (!media) {
    return '';
  }

  if (typeof media === 'object' && 'url' in media) {
    return toAbsoluteUrl((media as TenantMedia).url);
  }

  const mediaId = typeof media === 'number' ? media : Number(media);
  if (!Number.isFinite(mediaId)) {
    return '';
  }

  try {
    const mediaDoc = await payload.findByID({
      collection: 'tenant-media',
      id: mediaId,
      depth: 0,
    });

    return toAbsoluteUrl((mediaDoc as TenantMedia | null)?.url);
  } catch (error) {
    log.error({ err: error, mediaId }, 'Failed to resolve tenant media URL');
    return '';
  }
}

export type KeycloakBrandingForDoc = Pick<ResourceDirectory, 'brand' | 'name'>;

export async function buildKeycloakBrandingAttributes(
  doc: KeycloakBrandingForDoc,
  payload: BasePayload,
) {
  const primaryColor = doc.brand?.theme?.primaryColor || '#0b5db3';
  const borderRadius = doc.brand?.theme?.borderRadius || '8px';
  const title =
    asLocalizedString(doc.brand?.meta?.title) ||
    asLocalizedString(doc.name) ||
    'Sign in';
  const logoUrl = await resolveTenantMediaUrl(payload, doc.brand?.logo);

  return {
    primaryColor,
    borderRadius,
    title,
    logoUrl,
  };
}

export async function syncResourceDirectoryKeycloakBranding(
  req: PayloadRequest,
  doc: ResourceDirectory,
): Promise<void> {
  const tenantId =
    typeof doc.tenant === 'string' ? doc.tenant : (doc.tenant?.id ?? doc.id);

  if (!tenantId) {
    log.warn(
      { docId: doc.id },
      'Missing tenant id; skipping Keycloak branding sync',
    );
    return;
  }

  const tenant = await req.payload.findByID({
    collection: 'tenants',
    id: tenantId,
    depth: 0,
  });

  const realmId = tenant?.auth?.realmId;

  if (!realmId) {
    log.warn(
      { tenantId },
      'Tenant has no auth.realmId; skipping Keycloak branding sync',
    );
    return;
  }

  const attributes = await buildKeycloakBrandingAttributes(doc, req.payload);

  await syncKeycloakRealmBrandingAttributes(realmId, attributes);

  log.info({ tenantId, realmId }, 'Synchronized branding to Keycloak realm');
}
