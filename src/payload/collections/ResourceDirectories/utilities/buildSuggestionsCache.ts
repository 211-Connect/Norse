import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';
import { assertValidLocale } from '@/payload/i18n/locales';
import type { ResourceDirectory } from '@/payload/payload-types';
import type { SuggestionsCache } from '@/types/suggestionsCache';

const log = createLogger('buildSuggestionsCache');

/**
 * Builds a multi-locale suggestions cache for a specific tenant
 * by fetching all enabled locales and merging their values into a single structure.
 */
export async function buildSuggestionsCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc: ResourceDirectory,
  currentLocale: string | undefined,
): Promise<SuggestionsCache | null> {
  const suggestionsMap = new Map<
    string,
    SuggestionsCache['suggestions'][number]
  >();

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

    const suggestions = resourceDirectory.suggestions || [];

    suggestions.forEach((suggestion, index) => {
      const key = suggestion.id || `index:${index}`;

      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, {
          id: suggestion.id ?? undefined,
          taxonomies: suggestion.taxonomies,
          value: locale === 'en' ? suggestion.value : '',
          values: {},
        });
      }

      const suggestionCache = suggestionsMap.get(key)!;
      suggestionCache.values[locale] = suggestion.value;

      if (locale === 'en') {
        suggestionCache.value = suggestion.value;
      }
    });
  }

  if (suggestionsMap.size === 0) {
    return null;
  }

  return {
    tenantId,
    suggestions: Array.from(suggestionsMap.values()),
  };
}
