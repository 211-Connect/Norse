import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import qs from 'qs';
import { cache } from 'react';

import { SearchPageShell } from '@/app/(app)/features/search/components/search-page-shell';
import { SearchResultsProvider } from '@/app/(app)/features/search/context/search-results-context';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { isAdvancedGeoEnabled } from '@/app/(app)/shared/lib/search-utils';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import {
  FindResourcesQuery,
  findResources,
  findResourcesV2,
} from '@/app/(app)/shared/services/search-service';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { createLogger } from '@/lib/logger';
import { toBbox } from '@/app/(app)/shared/lib/utils';
import { arcjetProtectPage } from '@/lib/arcjet';
import { type FiltersMap } from '@/types/search';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '@/app/(app)/shared/lib/analytics';
import {
  parseSearchParams,
  RawSearchParams,
} from '@/app/(app)/features/search/utils/parseSearchParams';
import { handleLegacyDeepLinks } from '@/app/(app)/features/search/utils/handleLegacyDeepLinks';
import { parseLegacyAiClarifyParams } from '@/app/(app)/features/search/utils/parseLegacyAiClarifyParams';
import { navigateToSearchWithCoords } from '@/app/(app)/features/search/utils';

const log = createLogger('search-page');

const i18nNamespaces = ['page-search', 'page-resource', 'page-list', 'common'];

const getPageData = cache(async function (
  locale: string,
  rawParams: RawSearchParams,
) {
  const appConfig = await getAppConfigWithoutHost(locale);

  const searchQuery = parseSearchParams(rawParams);

  if (searchQuery.location && !searchQuery.coordinates) {
    await navigateToSearchWithCoords(
      locale,
      appConfig.tenantId,
      searchQuery,
      rawParams,
    );
  }

  // Run before the search executes: for AI-classification tenants this
  // always redirects, so running it after would discard a real search.
  await handleLegacyDeepLinks({
    appConfig,
    searchQuery,
    locale,
    skipLegacyLinkCheck: rawParams.sllc === '1',
  });

  const page =
    typeof rawParams.page === 'string' ? parseInt(rawParams.page) || 1 : 1;
  const limit = appConfig.search.resultsLimit;

  let useFindResourcesV2 = false;
  let results: ResultType[] = [];
  let totalResults = 0;
  let filters: FiltersMap = {};

  if (isAdvancedGeoEnabled() && searchQuery.location) {
    const [placeMetadata] = await forwardGeocode(searchQuery.location, {
      locale,
      tenantId: appConfig.tenantId,
    });

    if (placeMetadata) {
      const geoQuery: FindResourcesQuery = {
        ...searchQuery,
        coordinates: searchQuery.coordinates ?? placeMetadata.coordinates,
        placeType: placeMetadata.place_type,
        bbox: toBbox(placeMetadata.bbox),
      };

      try {
        const v2Result = await findResourcesV2(
          geoQuery,
          locale,
          page,
          limit,
          appConfig.tenantId,
          appConfig.search.searchEngine,
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
      appConfig.search.searchEngine,
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
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  const appConfig = await getAppConfigWithoutHost(locale);
  const searchQuery = parseSearchParams(rawParams);

  const baseTitle = appConfig.meta.title || appConfig.brand.name || '';
  const parts = [searchQuery.query, searchQuery.location].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim() !== '',
  );

  const description = appConfig.meta.description;
  const title =
    parts.length > 0 ? `${parts.join(' - ')} | ${baseTitle}` : baseTitle;

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
  const [paramsResult, searchParamsResult, cookieList] = await Promise.all([
    params,
    searchParams,
    getCookies({ cookies }),
  ]);

  const queryString = qs.stringify(searchParamsResult, {
    addQueryPrefix: true,
  });
  const locale = paramsResult.locale;
  const appConfig = await getAppConfigWithoutHost(locale);
  // Run arcjet off the critical path. A deny is only logged, so there is no
  // reason to block the SSR data fetch waiting for the verdict.
  void arcjetProtectPage(
    `/search${queryString}`,
    appConfig.tenantId || 'unknown',
  ).catch((err) => {
    log.warn({ err }, 'arcjet protect failed');
  });

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  const aiSearchAlert =
    typeof searchParamsResult.a === 'string' ? searchParamsResult.a : undefined;
  const legacyAiClarifyState = parseLegacyAiClarifyParams(searchParamsResult);

  const { filters, results, totalResults, resources, searchQuery, cardLayout } =
    await getPageData(locale, searchParamsResult);
  const currentPage =
    typeof searchParamsResult.page === 'string'
      ? parseInt(searchParamsResult.page, 10) || 1
      : 1;

  if (searchQuery.widgetId) {
    trackEvent(AnalyticsEvent.WidgetSearch, AnalyticsTools.Umami);
  }
  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      search={{
        coords: searchQuery.coordinates?.join(','),
        distance: searchQuery.distance,
        location: searchQuery.location,
        query: searchQuery.query,
        queryLabel: searchQuery.queryLabel,
        queryType: searchQuery.queryType,
      }}
      nonce={nonce}
    >
      <h1 className="sr-only">View Search Results</h1>
      <ResultsEvents results={results} totalResults={totalResults} />
      <SearchResultsProvider
        value={{
          results,
          totalResults,
          currentPage,
          filters,
          sort: searchQuery.sort ?? 'relevance',
          coordinates: searchQuery.coordinates ?? null,
        }}
      >
        <SearchPageShell
          legacyAiClarifyState={legacyAiClarifyState ?? undefined}
          cardLayout={cardLayout}
          aiSearchAlert={aiSearchAlert}
        />
      </SearchResultsProvider>
    </PageWrapper>
  );
}
