import { TypedLocale } from 'payload';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { findResourceDirectoryByTenantId } from '@/payload/collections/ResourceDirectories/actions';
import { Tenant } from '@/payload/payload-types';
import { SearchConfig } from '@/types/search-config';

/**
 * The public search settings the widget reads (`/api/search-config`), built
 * from the tenant's resource directory. Reads the database, so it runs in
 * the CMS only; the public app gets it through `@/lib/cms/search-config`.
 * `null` when the tenant has no resource directory.
 */
export async function buildSearchConfig(
  tenantId: string,
  locale: TypedLocale,
): Promise<SearchConfig | null> {
  const resourceDirectory = await findResourceDirectoryByTenantId(
    tenantId,
    locale as TypedLocale,
  );

  if (!resourceDirectory) {
    return null;
  }

  const tenant = resourceDirectory.tenant as Tenant;
  const domain = withOptionalCustomBasePath(
    `${tenant?.trustedDomains?.[0]?.domain ?? ''}`,
  );

  const subtopics =
    resourceDirectory.topics?.list?.flatMap((topic) =>
      (topic.subtopics ?? []).map(
        (subtopic): SearchConfig['subtopics'][number] => ({
          name: subtopic.name,
          topicName: topic.name,
          queryType: subtopic.queryType ?? 'text',
          query: subtopic.query || null,
          openInNewTab: subtopic.openInNewTab || null,
          href: subtopic.href || null,
        }),
      ),
    ) ?? [];

  const config: SearchConfig = {
    primaryColor: resourceDirectory.brand.theme.primaryColor,
    borderRadius: resourceDirectory.brand.theme.borderRadius,
    domain,
    texts: resourceDirectory.search.texts,
    resultsLimit: resourceDirectory.search.searchSettings.resultsLimit,
    radiusSelectValues:
      resourceDirectory.search.searchSettings.radiusSelectValues?.map(
        (r) => r.value,
      ) ?? [],
    defaultRadius: resourceDirectory.search.searchSettings.defaultRadius ?? 10,
    searchEngine:
      resourceDirectory.search.searchSettings.searchEngine ?? 'classic',
    suggestions: resourceDirectory.suggestions,
    subtopics,
  };

  return config;
}
