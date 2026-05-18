import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';
import { assertValidLocale } from '@/payload/i18n/locales';
import type { ResourceDirectory, TenantMedia } from '@/payload/payload-types';
import type { BrandingConfig } from '@/types/brandingConfig';

const DEFAULT_PRIMARY_COLOR = '#005191';
const DEFAULT_SECONDARY_COLOR = '#FFB351';
const DEFAULT_BORDER_RADIUS = '6px';
const DEFAULT_HEADER_GRADIENT_START = '#ffffff';
const DEFAULT_HEADER_GRADIENT_END = '#ffffff';

const log = createLogger('buildBrandingConfigCache');

function getMediaUrl(media?: TenantMedia | number | null): string | undefined {
  if (typeof media === 'number' || !media) return undefined;
  return media?.url || undefined;
}

function buildBrandingForLocale(
  resourceDirectory: ResourceDirectory,
  tenantId: string,
  locale: string,
): BrandingConfig {
  const brand = resourceDirectory.brand;
  const newLayout = resourceDirectory.newLayout;

  return {
    tenantId,
    locale,
    revision: resourceDirectory.updatedAt ?? new Date().toISOString(),
    resolvedFrom: {
      source: 'payload',
      resourceDirectoryId: resourceDirectory.id,
    },
    brand: {
      name: resourceDirectory.name,
      logoUrl: getMediaUrl(brand.logo),
      heroUrl: getMediaUrl(brand.hero),
      newLayoutLogoUrl: getMediaUrl(newLayout?.logo),
      newLayoutHeroUrl: getMediaUrl(newLayout?.hero),
      faviconUrl: getMediaUrl(brand.favicon),
      openGraphUrl: getMediaUrl(brand.openGraph),
      copyright: brand.copyright ?? undefined,
    },
    theme: {
      newLayoutEnabled: newLayout?.enabled ?? false,
      primaryColor: brand.theme.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      secondaryColor: brand.theme.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
      borderRadius: brand.theme.borderRadius ?? DEFAULT_BORDER_RADIUS,
      headerGradient: {
        start: newLayout?.headerStart ?? DEFAULT_HEADER_GRADIENT_START,
        end: newLayout?.headerEnd ?? DEFAULT_HEADER_GRADIENT_END,
      },
    },
    metadata: {
      title: brand.meta?.title ?? undefined,
      description: brand.meta?.description ?? undefined,
    },
    contact: {
      phoneNumber: brand.phoneNumber ?? undefined,
      feedbackUrl: brand.feedbackUrl ?? undefined,
    },
  };
}

/**
 * Builds a BrandingConfig snapshot for each enabled locale of a tenant.
 * Returns a map of locale -> BrandingConfig, or null if the resource
 * directory cannot be resolved for any locale.
 */
export async function buildBrandingConfigCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  _currentDoc: ResourceDirectory,
  _currentLocale: string | undefined,
): Promise<Map<string, BrandingConfig> | null> {
  const results = new Map<string, BrandingConfig>();

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const resourceDirectory = await payload
      .find({
        collection: 'resource-directories',
        where: { tenant: { equals: tenantId } },
        locale,
        limit: 1,
        depth: 1,
      })
      .then((result) => result.docs[0] || null);

    if (!resourceDirectory) {
      log.warn(
        { tenantId, locale },
        'No resource directory found for locale; skipping branding config snapshot',
      );
      continue;
    }

    results.set(locale, buildBrandingForLocale(resourceDirectory, tenantId, locale));
  }

  if (results.size === 0) {
    return null;
  }

  return results;
}
