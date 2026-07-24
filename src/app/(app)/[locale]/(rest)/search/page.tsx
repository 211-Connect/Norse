import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import qs from 'qs';
import { cache } from 'react';

import { SearchPageShell } from '@/app/(app)/features/search/components/search-page-shell';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
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
import { createLogger } from '@/lib/logger';
import { toBbox } from '@/app/(app)/shared/lib/utils';
import { arcjetProtectPage } from '@/lib/arcjet';

import { UmamiEvent, trackUmamiEvent } from '../../../shared/lib/umami';
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
    await navigateToSearchWithCoords(locale, searchQuery, rawParams);
  }

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
  await arcjetProtectPage(
    `/search${queryString}`,
    appConfig.tenantId || 'unknown',
  );

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const device = getServerDevice(headersList.get('user-agent') ?? '');

  const aiSearchAlert =
    typeof searchParamsResult.a === 'string' ? searchParamsResult.a : undefined;
  const legacyAiClarifyState = parseLegacyAiClarifyParams(searchParamsResult);

  const { filters, results, totalResults, resources, searchQuery, cardLayout } =
    await getPageData(locale, searchParamsResult);
  await handleLegacyDeepLinks({
    appConfig,
    searchQuery,
    locale,
    skipLegacyLinkCheck: searchParamsResult.sllc === '1',
  });

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
      <SearchPageShell
        legacyAiClarifyState={legacyAiClarifyState ?? undefined}
        cardLayout={cardLayout}
        aiSearchAlert={aiSearchAlert}
      />
    </PageWrapper>
  );
}
