import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';
import { assertValidLocale } from '@/payload/i18n/locales';
import type { ResourceDirectory } from '@/payload/payload-types';

const log = createLogger('buildLocaleConfigMap');

/**
 * Fetches the ResourceDirectory for each enabled locale and passes it to
 * `buildForLocale`, returning a locale→T map. Returns null if no locale
 * produced a result. Re-uses `currentDoc` for the locale being saved to
 * avoid an extra round-trip to the database.
 */
export async function buildLocaleConfigMap<T>(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc: ResourceDirectory,
  currentLocale: string | undefined,
  buildForLocale: (
    resourceDirectory: ResourceDirectory,
    tenantId: string,
    locale: string,
  ) => T,
  logLabel: string,
): Promise<Map<string, T> | null> {
  const results = new Map<string, T>();

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const resourceDirectory =
      locale === currentLocale && currentDoc
        ? currentDoc
        : await payload
            .find({
              collection: 'resource-directories',
              where: { tenant: { equals: tenantId } },
              locale,
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    if (!resourceDirectory) {
      log.warn(
        { tenantId, locale },
        `No resource directory found for locale; skipping ${logLabel} snapshot`,
      );
      continue;
    }

    results.set(locale, buildForLocale(resourceDirectory, tenantId, locale));
  }

  if (results.size === 0) {
    return null;
  }

  return results;
}
