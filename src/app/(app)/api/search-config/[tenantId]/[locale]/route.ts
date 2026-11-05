import { NextRequest, NextResponse } from 'next/server';
import { TypedLocale } from 'payload';

import { createLogger } from '@/lib/logger';
import { getSearchConfig } from '@/lib/cms/search-config';
import { locales } from '@/payload/i18n/locales';
import { withCache } from '@/utilities/withCache';

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

    const searchConfig = await withCache(
      `search_config:${tenantId}:${locale}`,
      () => getSearchConfig(tenantId, locale as TypedLocale),
      { redis: true, memory: true },
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
