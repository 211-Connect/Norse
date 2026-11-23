import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import { cache } from 'react';

import { SearchPageShell } from '@/app/(app)/features/search/components/search-page-shell';
import { SearchResultsProvider } from '@/app/(app)/features/search/context/search-results-context';
import { isV2Enabled } from '@/app/(app)/features/search/v2/enabled';
import { V2ResultsBridge } from '@/app/(app)/features/search/components/v2-results-bridge';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import {
  FindResourcesQuery,
  findResources,
} from '@/app/(app)/shared/services/search-service';
import { type ResultType } from '@/app/(app)/shared/store/results';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { toPinsQuery } from '@/app/(app)/shared/lib/search-params';
import { protectPage } from '@/lib/arcjet-page';
import {
  MAP_PINS_LIMIT,
  lastPageWithinPinLimit,
} from '@/app/(app)/features/search/utils/map-pins';
import { createLogger } from '@/lib/logger';
import { type FiltersMap } from '@/types/search';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '@/app/(app)/shared/lib/analytics';
import {
  toFindResourcesQuery,
  type RawSearchParams,
} from '@/app/(app)/features/search/intent';
import { handleLegacyDeepLinks } from '@/app/(app)/features/search/utils/handleLegacyDeepLinks';
import { areaSettingsOf } from '@/app/(app)/features/search/utils/area-settings';
import { liftSearchRequest } from '@/app/(app)/features/search/utils/liftSearchRequest';
import { navigateToSearchWithCoords } from '@/app/(app)/features/search/utils';
import { getPrintableDirectoryContextParams } from '@/app/(app)/shared/utils/printableDirectorySearchContext';

const log = createLogger('search-page');

const i18nNamespaces = ['page-search', 'page-resource', 'page-list', 'common'];

/** The tenant's area search settings, sent with every area search (`region`). */
function withAreaSettings(
  query: FindResourcesQuery,
  appConfig: Awaited<ReturnType<typeof getAppConfigWithoutHost>>,
): FindResourcesQuery {
  if (!query.region) return query;
  return {
    ...query,
    ...areaSettingsOf(appConfig.search),
  };
}

const getPageData = cache(async function (
  locale: string,
  rawParams: RawSearchParams,
) {
  const appConfig = await getAppConfigWithoutHost(locale);

  const { intent, envelope } = liftSearchRequest(rawParams);
  const searchQuery = withAreaSettings(
    toFindResourcesQuery(intent, { v2: appConfig.featureFlags.enableV2Api }),
    appConfig,
  );

  // An area search needs no coords; they would only set the distance-sort origin.
  if (searchQuery.location && !searchQuery.coordinates && !searchQuery.region) {
    // The redirect re-serialises the URL as received; moving it onto the serializer is ISS-2376.
    await navigateToSearchWithCoords(
      locale,
      appConfig.tenantId,
      searchQuery,
      rawParams,
    );
  }

  // Resolve before the search executes: a redirect here would discard a real search.
  const clarify = await handleLegacyDeepLinks({
    appConfig,
    intent,
    locale,
    printableDirectoryContext: getPrintableDirectoryContextParams(rawParams),
    skipLegacyLinkCheck: envelope.sllc === '1',
  });

  const limit = appConfig.search.resultsLimit;
  const { showAllResultsOnMap, searchEngine } = appConfig.search;
  const requestedPage =
    envelope.page !== undefined ? parseInt(envelope.page) || 1 : 1;
  const page = showAllResultsOnMap
    ? Math.min(requestedPage, lastPageWithinPinLimit(limit))
    : requestedPage;

  // The map fetches its pins once the list is on screen, so they never delay it.
  // The dialog that opens over a clarify URL hides the map, so nobody would see them.
  const pinsQuery =
    showAllResultsOnMap && !clarify?.autoOpenDialog
      ? toPinsQuery(searchQuery, locale, searchEngine)
      : null;

  let results: ResultType[] = [];
  let totalResults = 0;
  let filters: FiltersMap = {};

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
      { locale, page, limit, tenantId: appConfig.tenantId },
      'Search returned no result object; defaulting to empty results',
    );
  } else {
    results = searchResult.results as ResultType[];
    totalResults = searchResult.totalResults;
    filters = searchResult.filters;
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
    pinsQuery,
    page,
    resources,
    t,
    searchQuery,
    envelope,
    clarify,
    intent,
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
  const searchQuery = toFindResourcesQuery(
    liftSearchRequest(rawParams).intent,
    {
      v2: appConfig.featureFlags.enableV2Api,
    },
  );

  const baseTitle = appConfig.meta.title || appConfig.brand.name || '';
  const parts = [
    searchQuery.queryLabel || searchQuery.query,
    searchQuery.location,
  ].filter(
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

  const locale = paramsResult.locale;

  // Before any data fetch or streaming, so a denial is a real 403.
  await protectPage(`/${locale}/search`);

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  const {
    filters,
    results,
    totalResults,
    resources,
    searchQuery,
    envelope,
    clarify: legacyAiClarifyState,
    intent,
    cardLayout,
    pinsQuery,
    page: currentPage,
    appConfig,
  } = await getPageData(locale, searchParamsResult);
  const aiSearchAlert = envelope.a;
  const shell = (v2: boolean) => {
    const page = (
      <SearchPageShell
        legacyAiClarifyState={legacyAiClarifyState ?? undefined}
        searchIntent={intent}
        cardLayout={cardLayout}
        aiSearchAlert={aiSearchAlert}
      />
    );
    return v2 ? <V2ResultsBridge>{page}</V2ResultsBridge> : page;
  };
  const listTotal = appConfig.search.showAllResultsOnMap
    ? Math.min(totalResults, MAP_PINS_LIMIT)
    : totalResults;

  if (searchQuery.widgetId) {
    trackEvent(AnalyticsEvent.WidgetSearch, AnalyticsTools.Umami);
  }
  return (
    <PageWrapper
      fitViewport
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      search={{
        coords: searchQuery.coordinates?.join(','),
        region: searchQuery.region,
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
          totalResults: listTotal,
          isTotalCapped: listTotal < totalResults,
          pinsQuery,
          currentPage,
          filters,
          sort: searchQuery.sort ?? 'relevance',
          coordinates: searchQuery.coordinates ?? null,
          region: searchQuery.region ?? null,
        }}
      >
        {/* The tenant's v2 switch: off renders the v1 page, with no v2 call. */}
        {shell(isV2Enabled(appConfig))}
      </SearchResultsProvider>
    </PageWrapper>
  );
}
