import type { CollectionAfterChangeHook } from 'payload';

import { createLogger } from '@/lib/logger';
import type { ResourceDirectory } from '@/payload/payload-types';

import { syncKeycloakRealmBrandingAttributes } from './keycloakRealmBranding';

const log = createLogger('syncKeycloakRealmBrandingAfterChange');

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

function resolveLogoUrl(doc: ResourceDirectory): string {
  const logo = doc.brand?.logo;

  if (logo && typeof logo === 'object' && 'url' in logo) {
    return toAbsoluteUrl(logo.url || '');
  }

  return '';
}

export const syncKeycloakRealmBrandingAfterChange: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') {
    return doc;
  }

  try {
    const tenantId =
      typeof doc.tenant === 'string' ? doc.tenant : (doc.tenant?.id ?? doc.id);

    if (!tenantId) {
      log.warn(
        { docId: doc.id },
        'Missing tenant id; skipping Keycloak branding sync',
      );
      return doc;
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
      return doc;
    }

    const primaryColor = doc.brand?.theme?.primaryColor || '#0b5db3';
    const borderRadius = doc.brand?.theme?.borderRadius || '8px';
    const title =
      asLocalizedString(doc.brand?.meta?.title) ||
      asLocalizedString(doc.name) ||
      'Sign in';
    const logoUrl = resolveLogoUrl(doc);

    await syncKeycloakRealmBrandingAttributes(realmId, {
      primaryColor,
      borderRadius,
      title,
      logoUrl,
    });

    log.info(
      { tenantId, realmId, operation },
      'Synchronized branding to Keycloak realm attributes',
    );
  } catch (error) {
    log.error(
      { err: error, docId: doc.id, operation },
      'Failed to synchronize branding to Keycloak; save continues',
    );
  }

  return doc;
};
