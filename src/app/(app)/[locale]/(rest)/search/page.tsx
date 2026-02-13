import { FilterPanel } from '@/app/(app)/features/search/components/filter-panel';
import { MapContainer } from '@/app/(app)/features/search/components/map-container';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { ResultsSection } from '@/app/(app)/features/search/components/results-section';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import {
  findResources,
  findResourcesV2,
} from '@/app/(app)/shared/services/search-service';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import { cache } from 'react';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import { isAdvancedGeoEnabled } from '@/app/(app)/shared/lib/search-utils';

const i18nNamespaces = ['page-search', 'page-resource', 'common'];

type SearchParams = {
  location: string;
  coords: string;
  query: string;
  query_label: string;
  query_type: string;
  page: string;
  distance: string;
};

const getPageData = cache(async function (
  locale: string,
  searchParams: SearchParams,
) {
  const appConfig = await getAppConfigWithoutHost(locale);

  const { location, coords, query, query_label, distance, page } = searchParams;

  const limit = appConfig.search.resultsLimit;

  const geospatialSearchLocation = isAdvancedGeoEnabled() && location;

  let useFindResourcesV2 = false;
  let results, noResults, totalResults, filters;

  if (geospatialSearchLocation) {
    const [placeMetadata] = await forwardGeocode(location, { locale });

    if (placeMetadata) {
      const searchStore = {
        query: query || '',
        queryLabel: query_label || '',
        queryType: query_label || '',
        searchLocation: location || '',
        searchCoordinates:
          coords?.split(',').map(Number) || placeMetadata.coordinates,
        searchDistance: distance || '0',
        searchPlaceType: placeMetadata.place_type,
        searchBbox: placeMetadata.bbox,
      };

      try {
        // Use V2 with complete data
        ({ results, noResults, totalResults, filters } = await findResourcesV2(
          searchStore,
          locale,
          parseInt(page ?? '1'),
          limit,
          appConfig.tenantId,
        ));
        useFindResourcesV2 = true;
      } catch (error) {
        console.error(
          'Geospatial search failed, falling back to legacy:',
          error,
        );
      }
    }
  }

  // Fallback to legacy search if geospatial wasn't used or failed
  if (!useFindResourcesV2) {
    ({ results, noResults, totalResults, filters } = await findResources(
      searchParams,
      locale,
      parseInt(page ?? '1'),
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
  };
});

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> => {
  const [paramsResult, searchParamsResult] = await Promise.all([
    params,
    searchParams,
  ]);

  const { appConfig, results, totalResults, t } = await getPageData(
    paramsResult.locale,
    searchParamsResult,
  );

  const title = `${
    searchParamsResult.query_label ||
    searchParamsResult.query ||
    t('no_query', { ns: 'page-search' })
  } - ${totalResults?.toLocaleString()} ${t('results', { ns: 'page-search' })}`;

  const description = `Showing ${
    results.length >= 25 ? '25' : results.length
  } / ${totalResults} ${t('results_for', { ns: 'page-search' })} ${searchParamsResult.query || ''}.`;

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
  searchParams: Promise<SearchParams>;
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
  const { coords, distance, query, query_label, query_type, location } =
    searchParamsResult;

  const { filters, results, noResults, totalResults, resources } =
    await getPageData(locale, searchParamsResult);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{
        coords,
        currentPage: searchParamsResult.page || '1',
        device,
        distance,
        filters,
        location,
        noResults,
        query,
        query_label,
        query_type,
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
