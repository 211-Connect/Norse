import type { Payload } from 'payload';
import type { FacetsCache, FacetConfig } from '@/types/facets';
import type { ResourceDirectory } from '@/payload/payload-types';
import { assertValidLocale } from '@/payload/i18n/locales';
import { createLogger } from '@/lib/logger';

const log = createLogger('buildFacetsCache');

/**
 * Builds facets cache structure for a specific tenant
 * by fetching all locales and merging their labels into a single structure.
 */
export async function buildFacetsCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc: ResourceDirectory,
  currentLocale: string | undefined,
): Promise<FacetsCache | null> {
  // Map to store facets by facet identifier
  const facetsMap = new Map<string, FacetConfig>();

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const resourceDirectory =
      locale === currentLocale && currentDoc
        ? currentDoc
        : await payload
            .find({
              collection: 'resource-directories',
              where: {
                tenant: {
                  equals: tenantId,
                },
              },
              locale,
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    if (!resourceDirectory) {
      log.warn(
        { tenantId, locale },
        'No resource directory found; skipping locale',
      );
      continue;
    }

    const facets = resourceDirectory.search?.facets || [];

    for (const facet of facets) {
      if (!facet.facet || !facet.name) {
        log.warn(
          { tenantId, locale },
          'Invalid facet entry (missing facet or name); skipping',
        );
        continue;
      }

      const key = facet.facet;

      if (!facetsMap.has(key)) {
        facetsMap.set(key, {
          facet: facet.facet,
          name: '',
        });
      }

      const facetConfig = facetsMap.get(key)!;
      facetConfig[locale] = facet.name;
      if (locale === 'en') {
        facetConfig.name = facet.name;
      }
    }
  }

  if (facetsMap.size === 0) {
    return null;
  }

  return {
    tenantId,
    facets: Array.from(facetsMap.values()),
  };
}
