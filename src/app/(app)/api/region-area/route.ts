import { NextRequest, NextResponse } from 'next/server';

import { getRegionArea } from '@/app/(app)/shared/services/region-area-service';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { isRegionId } from '@/types/areaSearch';
import { isValidLocale } from '@/payload/i18n/locales';

/** Boundaries change only when the regions index is reseeded. */
const BROWSER_CACHE_SECONDS = 24 * 60 * 60;

/**
 * The outline of the area a search is filtered to (`region` in the `/search`
 * URL), fetched by the search map. The tenant comes from the host, never the
 * query. See docs/area-search.md.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const locale = request.nextUrl.searchParams.get('locale') ?? '';

  if (!isRegionId(id)) {
    return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
  }
  if (!isValidLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const appConfig = await getAppConfigWithoutHost(locale);
  const area = await getRegionArea(id, appConfig.tenantId);

  if (!area) {
    return NextResponse.json({ error: 'Region unavailable' }, { status: 502 });
  }

  return NextResponse.json(area, {
    headers: {
      // Private: the request is tenant-scoped by host, even if the shape is not.
      'Cache-Control': `private, max-age=${BROWSER_CACHE_SECONDS}`,
    },
  });
}
