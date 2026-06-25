import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import qs from 'qs';
import { cache } from 'react';

import { FilterPanel } from '@/app/(app)/features/search/components/filter/filter-panel';
import { MapContainer } from '@/app/(app)/features/search/components/map-container';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { ResultsSection } from '@/app/(app)/features/search/components/results-section';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getServerDevice } from '@/app/(app)/shared/lib/get-server-device';
import { isAdvancedGeoEnabled } from '@/app/(app)/shared/lib/search-utils';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import {
  FindResourcesQuery,
  findResources,
  findResourcesV2,
} from '@/app/(app)/shared/services/search-service';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSortOption } from '@/app/(app)/shared/utils/getSortOption';
import { parseCommaSeparatedValues } from '@/app/(app)/shared/utils/parseCommaSeparatedValues';
import { createLogger } from '@/lib/logger';

import { UmamiEvent, trackUmamiEvent } from '../../../shared/lib/umami';

const log = createLogger('search-page');

const i18nNamespaces = ['page-search', 'page-resource', 'page-list', 'common'];

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Parse the raw Next.js searchParams (which may contain bracket-notation filter keys
 * like `filters[key][0]=val`) into a typed FindResourcesQuery object.
 */
function parseSearchParams(raw: RawSearchParams): FindResourcesQuery {
  const entries = Object.entries(raw).flatMap(([k, v]) =>
    (Array.isArray(v) ? v : [v ?? '']).map(
      (val) => [k, val] as [string, string],
    ),
  );
  const parsed = qs.parse(new URLSearchParams(entries).toString());

  const coordsStr =
    typeof parsed.coords === 'string' ? parsed.coords : undefined;
  const coordinates = coordsStr
    ? coordsStr
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n))
    : undefined;
  const sort = getSortOption(String(parsed.sort), coordinates);

  return {
    query:
      typeof parsed.query === 'string' ? parsed.query || undefined : undefined,
    queryLabel:
      typeof parsed.query_label === 'string'
        ? parsed.query_label || undefined
        : undefined,
    queryType:
      typeof parsed.query_type === 'string'
        ? parsed.query_type || undefined
        : undefined,
    location:
      typeof parsed.location === 'string'
        ? parsed.location || undefined
        : undefined,
    coordinates,
    distance:
      typeof parsed.distance === 'string'
        ? parsed.distance || undefined
        : undefined,
    taxonomy: parseCommaSeparatedValues(raw.taxonomy),
    filters: parsed.filters as Record<string, string[]> | undefined,
    sort,
    age:
      typeof parsed.age === 'string' && parsed.age
        ? parseInt(parsed.age, 10) || undefined
        : undefined,
  };
}

const getPageData = cache(async function (
  locale: string,
  rawParams: RawSearchParams,
) {
  const appConfig = await getAppConfigWithoutHost(locale);

  const searchQuery = parseSearchParams(rawParams);
  const page =
    typeof rawParams.page === 'string' ? parseInt(rawParams.page) || 1 : 1;
  const limit = appConfig.search.resultsLimit;

  let useFindResourcesV2 = false;
  let results: ResultType[] = [];
  let totalResults = 0;
  let filters: Record<string, unknown> = {};

  if (isAdvancedGeoEnabled() && searchQuery.location) {
    const [placeMetadata] = await forwardGeocode(searchQuery.location, {
      locale,
    });

    if (placeMetadata) {
      const geoQuery: FindResourcesQuery = {
        ...searchQuery,
        coordinates: searchQuery.coordinates ?? placeMetadata.coordinates,
        placeType: placeMetadata.place_type,
        bbox: placeMetadata.bbox,
      };

      try {
        const v2Result = await findResourcesV2(
          geoQuery,
          locale,
          page,
          limit,
          appConfig.tenantId,
          appConfig.search.hybridSemanticSearchEnabled,
        );
        results = v2Result.results as ResultType[];
        totalResults = v2Result.totalResults;
        filters = v2Result.filters;
        useFindResourcesV2 = true;
      } catch (error) {
        log.error(
          { err: error },
          'Geospatial search failed; falling back to legacy',
        );
      }
    }
  }

  // Fallback to legacy search if geospatial wasn't used or failed
  if (!useFindResourcesV2) {
    const searchResult = await findResources(
      searchQuery,
      locale,
      page,
      limit,
      appConfig.tenantId,
      appConfig.search.hybridSemanticSearchEnabled,
    );

    if (!searchResult) {
      log.warn(
        { searchQuery, locale, page, limit, tenantId: appConfig.tenantId },
        'Search returned no result object; defaulting to empty results',
      );
      results = [];
      totalResults = 0;
      filters = {};
    } else {
      results = searchResult.results as ResultType[];
      totalResults = searchResult.totalResults;
      filters = searchResult.filters;
    }
  }

  const { resources, t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const cardLayout = appConfig.search.cardLayout ?? DEFAULT_SEARCH_CARD_LAYOUT;

  return {
    appConfig,
    filters,
    results,
    totalResults,
    resources,
    t,
    searchQuery,
    cardLayout,
  };
});

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> => {
  const [paramsResult, searchParamsResult] = await Promise.all([
    params,
    searchParams,
  ]);

  const { appConfig, results, totalResults, t, searchQuery } =
    await getPageData(paramsResult.locale, searchParamsResult);

  const title = `${
    searchQuery.queryLabel ||
    searchQuery.query ||
    t('no_query', { ns: 'page-search' })
  } - ${totalResults?.toLocaleString()} ${t('results', { ns: 'page-search' })}`;

  const description = `Showing ${
    results.length >= 25 ? '25' : results.length
  } / ${totalResults} ${t('results_for', { ns: 'page-search' })} ${searchQuery.query || ''}.`;

  return {
    openGraph: {
      description,
      images: appConfig.brand.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title,
    },
    description,
    title,
  };
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const device = getServerDevice(headersList.get('user-agent') ?? '');

  const [paramsResult, searchParamsResult, cookieList] = await Promise.all([
    await params,
    await searchParams,
    getCookies({ cookies }),
  ]);
  const locale = paramsResult.locale;
  const aiSearchAlert =
    typeof searchParamsResult.a === 'string' ? searchParamsResult.a : undefined;

  const { filters, results, totalResults, resources, searchQuery, cardLayout } =
    await getPageData(locale, searchParamsResult);

  if (searchQuery.widgetId) {
    trackUmamiEvent(UmamiEvent.WidgetSearch);
  }
  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{
        coords: searchQuery.coordinates?.join(',') ?? '',
        currentPage:
          typeof searchParamsResult.page === 'string'
            ? parseInt(searchParamsResult.page, 10) || 1
            : 1,
        device,
        distance: searchQuery.distance,
        filters,
        location: searchQuery.location ?? '',
        query: searchQuery.query ?? '',
        query_label: searchQuery.queryLabel ?? '',
        query_type: searchQuery.queryType ?? '',
        results,
        totalResults,
      }}
      nonce={nonce}
    >
      <h1 className="sr-only">View Search Results</h1>
      <ResultsEvents results={results} totalResults={totalResults} />
      <div className="flex h-full w-full flex-col md:flex-row">
        <FilterPanel />
        <ResultsSection cardLayout={cardLayout} aiSearchAlert={aiSearchAlert} />
        <MapContainer />
      </div>
    </PageWrapper>
  );
}
