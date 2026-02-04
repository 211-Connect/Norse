import { FilterPanel } from '@/app/(app)/features/search/components/filter-panel';
import { MapContainer } from '@/app/(app)/features/search/components/map-container';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { ResultsSection } from '@/app/(app)/features/search/components/results-section';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getServerDevice } from '@/app/(app)/shared/lib/get-server-device';
import { findResources } from '@/app/(app)/shared/services/search-service';
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

  const { results, totalResults } = await findResources(
    searchParamsResult,
    locale,
    parseInt((searchParamsResult?.page as string) ?? '1'),
    limit,
    appConfig.tenantId,
  );

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

  const resultResources = await findResources(
    searchParamsResult,
    locale,
    parseInt((searchParamsResult?.page as string) ?? '1'),
    limit,
    appConfig.tenantId,
  );

  const { noResults, page, results, totalResults, filters } = resultResources;
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
