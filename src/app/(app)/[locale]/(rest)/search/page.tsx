import { FilterPanel } from '@/app/(app)/features/search/components/filter-panel';
import { MapContainer } from '@/app/(app)/features/search/components/map-container';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { ResultsSection } from '@/app/(app)/features/search/components/results-section';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import {
  findResources,
  FindResourcesQuery,
  findResourcesV2,
} from '@/app/(app)/shared/services/search-service';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import { cache } from 'react';
import qs from 'qs';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import { isAdvancedGeoEnabled } from '@/app/(app)/shared/lib/search-utils';
import { createLogger } from '@/lib/logger';

const log = createLogger('search-page');

const i18nNamespaces = ['page-search', 'page-resource', 'common'];

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
    coordinates: coordsStr
      ? coordsStr
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined,
    distance:
      typeof parsed.distance === 'string'
        ? parsed.distance || undefined
        : undefined,
    filters: parsed.filters as Record<string, string[]> | undefined,
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
  let results, noResults, totalResults, filters;

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
        ({ results, noResults, totalResults, filters } = await findResourcesV2(
          geoQuery,
          locale,
          page,
          limit,
          appConfig.tenantId,
        ));
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
    ({ results, noResults, totalResults, filters } = await findResources(
      searchQuery,
      locale,
      page,
      limit,
      appConfig.tenantId,
    ));
  }

  const { resources, t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return {
    appConfig,
    filters,
    results,
    noResults,
    totalResults,
    resources,
    t,
    searchQuery,
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
  const device = headersList.get('user-agent') ?? '';

  const [paramsResult, searchParamsResult, cookieList] = await Promise.all([
    await params,
    await searchParams,
    getCookies({ cookies }),
  ]);
  const locale = paramsResult.locale;

  const { filters, results, noResults, totalResults, resources, searchQuery } =
    await getPageData(locale, searchParamsResult);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{
        coords: searchQuery.coordinates?.join(',') ?? '',
        currentPage:
          typeof searchParamsResult.page === 'string'
            ? searchParamsResult.page
            : '1',
        device,
        distance: searchQuery.distance ?? '',
        filters,
        location: searchQuery.location ?? '',
        noResults,
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
        <ResultsSection />
        <MapContainer />
      </div>
    </PageWrapper>
  );
}
