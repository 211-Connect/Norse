import { FilterPanel } from '@/app/(app)/features/search/components/filter-panel';
import { MapContainer } from '@/app/(app)/features/search/components/map-container';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { ResultsSection } from '@/app/(app)/features/search/components/results-section';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getServerDevice } from '@/app/(app)/shared/lib/get-server-device';
import {
  findResources,
  findResourcesV2,
} from '@/app/(app)/shared/services/search-service';
import { geocodeLocationCached } from '@/app/(app)/shared/services/geocoding-service';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import { cache } from 'react';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

const i18nNamespaces = ['page-search', 'page-resource', 'common'];

const getPageData = cache(async function (
  locale: string,
  searchParams: {
    location: string;
    coords: string;
    query: string;
    query_label: string;
    query_type: string;
  },
) {
  const appConfig = await getAppConfigWithoutHost(locale);

  const { location, coords, query, query_label, query_type } = searchParams;
  const cookieList = await getCookies({ cookies });

  const { t, resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const limit = appConfig.search.resultsLimit;

  return {
    appConfig,
    cookies: cookieList,
    coords,
    i18n: { t, resources },
    limit,
    locale,
    location,
    query,
    query_label,
    query_type,
  };
});

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    location: string;
    coords: string;
    query: string;
    query_label: string;
    query_type: string;
    page: string;
    distance: string;
  }>;
}): Promise<Metadata> => {
  const [paramsResult, searchParamsResult] = await Promise.all([
    params,
    searchParams,
  ]);

  const {
    appConfig,
    i18n: { t },
    limit,
    locale,
    query,
    query_label,
  } = await getPageData(paramsResult.locale, searchParamsResult);

  // Check if we should use V2 with geospatial filtering (matches logic in SearchPage)
  const useGeospatialSearch =
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG ===
      'true' && searchParamsResult?.location;

  let results, totalResults;

  if (useGeospatialSearch) {
    // Server-side geocoding to get place metadata
    const placeMetadata = await geocodeLocationCached(
      searchParamsResult.location,
      locale,
    );

    if (placeMetadata) {
      const searchStore = {
        query: query || '',
        queryLabel: query_label || '',
        queryType: query_label || '',
        searchLocation: searchParamsResult.location || '',
        searchCoordinates:
          searchParamsResult.coords?.split(',').map(Number) ||
          placeMetadata.coordinates,
        searchDistance: searchParamsResult.distance || '0',
        searchPlaceType: placeMetadata.place_type,
        searchBbox: placeMetadata.bbox,
      };

      try {
        ({ results, totalResults } = await findResourcesV2(
          searchStore,
          locale,
          parseInt((searchParamsResult?.page as string) ?? '1'),
          limit,
          appConfig.tenantId,
        ));
      } catch (error) {
        console.error(
          'Geospatial search failed, falling back to legacy:',
          error,
        );
        // Fallback below
      }
    }
  }

  // Fallback or legacy path
  if (!results) {
    ({ results, totalResults } = await findResources(
      searchParamsResult,
      locale,
      parseInt((searchParamsResult?.page as string) ?? '1'),
      limit,
      appConfig.tenantId,
    ));
  }

  const title = `${
    query_label || query || t('no_query', { ns: 'page-search' })
  } - ${totalResults?.toLocaleString()} ${t('results', { ns: 'page-search' })}`;

  const description = `Showing ${
    results.length >= 25 ? '25' : results.length
  } / ${totalResults} ${t('results_for', { ns: 'page-search' })} ${query || ''}.`;

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
  searchParams: Promise<{
    location: string;
    coords: string;
    query: string;
    query_label: string;
    query_type: string;
    page: string;
    distance: string;
  }>;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const device = headersList.get('user-agent') ?? '';

  const [paramsResult, searchParamsResult] = await Promise.all([
    await params,
    await searchParams,
  ]);

  const {
    appConfig,
    cookies,
    coords,
    i18n: { resources },
    limit,
    locale,
    location,
    query,
    query_label,
    query_type,
  } = await getPageData(paramsResult.locale, searchParamsResult);

  // Check if we should use V2 with geospatial filtering
  const useGeospatialSearch =
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG ===
      'true' && location;

  let useFindResourcesV2 = false;
  let results, noResults, page, totalResults, filters;

  if (useGeospatialSearch) {
    // Server-side geocoding to get place metadata
    const placeMetadata = await geocodeLocationCached(location, locale);

    if (placeMetadata) {
      const searchStore = {
        query: query || '',
        queryLabel: query_label || '',
        queryType: query_label || '',
        searchLocation: location || '',
        searchCoordinates:
          coords?.split(',').map(Number) || placeMetadata.coordinates,
        searchDistance: searchParamsResult.distance || '0',
        searchPlaceType: placeMetadata.place_type,
        searchBbox: placeMetadata.bbox,
      };

      try {
        // Use V2 with complete data
        ({ results, noResults, page, totalResults, filters } =
          await findResourcesV2(
            searchStore,
            locale,
            parseInt((searchParamsResult?.page as string) ?? '1'),
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
    ({ results, noResults, page, totalResults, filters } = await findResources(
      searchParamsResult,
      locale,
      parseInt((searchParamsResult?.page as string) ?? '1'),
      limit,
      appConfig.tenantId,
    ));
  }

  return (
    <PageWrapper
      cookies={cookies}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{
        coords,
        currentPage: page,
        device,
        distance: searchParamsResult.distance,
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
