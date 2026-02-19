import type { Payload } from 'payload';
import type {
  CustomAttribute,
  OrchestrationConfigCache,
  SchemaConfig,
} from '@/types/customAttributes';
import type { OrchestrationConfig } from '@/payload/payload-types';
import { assertValidLocale } from '@/payload/i18n/locales';

/**
 * Builds orchestration config cache structure for a specific tenant
 * by fetching all locales and merging their labels into a single structure.
 */
export async function buildOrchestrationConfigCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc?: OrchestrationConfig,
  currentLocale?: string,
): Promise<OrchestrationConfigCache | null> {
  // Map to store schemas: schemaName -> Map of attributes by source_column
  const schemasMap = new Map<string, Map<string, CustomAttribute>>();

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const orchestrationConfig =
      locale === currentLocale && currentDoc
        ? currentDoc
        : await payload
            .find({
              collection: 'orchestration-config',
              where: {
                tenant: {
                  equals: tenantId,
                },
              },
              locale,
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    if (!orchestrationConfig) {
      console.warn(
        `[buildOrchestrationConfigCache] No orchestration config found for tenant ID: ${tenantId}, locale: ${locale}`,
      );
      continue;
    }

    const schemas = orchestrationConfig.schemas || [];

    for (const schema of schemas) {
      if (!schema.schemaName || !schema.customAttributes) {
        console.warn(
          `[buildOrchestrationConfigCache] Invalid schema entry for tenant ID: ${tenantId}, locale: ${locale}. Skipping.`,
        );
        continue;
      }

      const schemaName = schema.schemaName;

      // Get or create the attributes map for this schema
      if (!schemasMap.has(schemaName)) {
        schemasMap.set(schemaName, new Map<string, CustomAttribute>());
      }

      const attributesMap = schemasMap.get(schemaName)!;

      for (const attr of schema.customAttributes) {
        const key = attr.source_column;

        if (!attributesMap.has(key)) {
          attributesMap.set(key, {
            source_column: attr.source_column,
            link_entity: attr.link_entity,
            label: {},
            origin: attr.origin || null,
            searchable: attr.searchable ?? null,
            id: attr.id || null,
          });
        }

        const customAttr = attributesMap.get(key)!;
        customAttr.label[locale] = attr.label || '';
      }
    }
  }

  if (schemasMap.size === 0) {
    return null;
  }

  // Convert map to array of SchemaConfig
  const schemas: SchemaConfig[] = Array.from(schemasMap.entries()).map(
    ([schemaName, attributesMap]) => ({
      schemaName,
      customAttributes: Array.from(attributesMap.values()),
    }),
  );

  return {
    tenantId,
    schemas,
  };
}
