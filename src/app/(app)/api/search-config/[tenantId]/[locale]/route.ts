import { NextRequest, NextResponse } from 'next/server';
import { findResourceDirectoryByTenantId } from '@/payload/collections/ResourceDirectories/actions';
import { SearchConfig } from '@/types/search-config';
import { TypedLocale } from 'payload';
import { locales } from '@/payload/i18n/locales';
import { Tenant } from '@/payload/payload-types';
import { withRedisCache } from '@/utilities/withRedisCache';
import { createLogger } from '@/lib/logger';

const log = createLogger('search-config');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: corsHeaders,
    },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; locale: string }> },
) {
  const { tenantId, locale } = await params;

  try {
    if (!locales.includes(locale as TypedLocale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const searchConfig = await withRedisCache(
      `search_config:${tenantId}:${locale}`,
      async () => {
        const resourceDirectory = await findResourceDirectoryByTenantId(
          tenantId,
          locale as TypedLocale,
        );

        if (!resourceDirectory) {
          return null;
        }

        const tenant = resourceDirectory.tenant as Tenant;
        const domain = `${tenant?.trustedDomains?.[0]?.domain ?? ''}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}`;

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
          defaultRadius:
            resourceDirectory.search.searchSettings.defaultRadius ?? 10,
          hybridSemanticSearchEnabled:
            resourceDirectory.search.searchSettings
              .hybridSemanticSearchEnabled ?? false,
          suggestions: resourceDirectory.suggestions,
          subtopics,
        };

        return config;
      },
    );

    if (!searchConfig) {
      return NextResponse.json(
        { error: 'Resource directory not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(searchConfig, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    log.error({ err: error, tenantId, locale }, 'Error fetching search config');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
