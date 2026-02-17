import type { Payload } from 'payload';
import type {
  CustomAttribute,
  CustomAttributesCache,
} from '@/types/customAttributes';
import type { ResourceDirectory } from '@/payload/payload-types';
import { assertValidLocale } from '@/payload/i18n/locales';

/**
 * Builds a consolidated custom attributes cache structure for a tenant
 * by fetching all locales and merging their labels into a single array.
 */
export async function buildCustomAttributesCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc?: ResourceDirectory,
  currentLocale?: string,
): Promise<CustomAttributesCache> {
  const attributesMap = new Map<string, CustomAttribute>();

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const resourceDirectory =
      locale === currentLocale && currentDoc
        ? currentDoc
        : await payload.findByID({
            collection: 'resource-directories',
            id: tenantId,
            locale,
          });

    const attributes = resourceDirectory.customAttributes?.attributes || [];

    for (const attr of attributes) {
      const key = attr.source_column;

      if (!attributesMap.has(key)) {
        attributesMap.set(key, {
          source_column: attr.source_column,
          link_entity: attr.link_entity,
          label: {},
          provenance: attr.provenance || null,
          searchable: attr.searchable ?? null,
          id: attr.id || null,
        });
      }

      const customAttr = attributesMap.get(key)!;
      customAttr.label[locale] = attr.label || '';
    }
  }

  return Array.from(attributesMap.values());
}
