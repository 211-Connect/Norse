import { getSession } from '@/auth';
import { FilterPanel } from '@/app/features/search/components/filter-panel';
import { MapContainer } from '@/app/features/search/components/map-container';
import { ResultsEvents } from '@/app/features/search/components/results-events';
import { ResultsSection } from '@/app/features/search/components/results-section';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import initTranslations from '@/app/shared/i18n/i18n';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import { getServerDevice } from '@/app/shared/lib/get-server-device';
import { findResources } from '@/app/shared/services/search-service';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';
import { cache } from 'react';

const i18nNamespaces = [
  'page-search',
  'page-resource',
  'common',
  'dynamic',
  'categories',
  'suggestions',
];

function getUrlSearchParams(params: {
  [key: string]: string | string[] | undefined;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  return searchParams;
}

const getPageData = cache(async function (
  stringifiedParams: string,
  stringifiedSearchParams: string,
) {
  const { locale } = JSON.parse(stringifiedParams);
  const searchParamsResult = JSON.parse(stringifiedSearchParams);

  const appConfig = getAppConfig();

  const { location, coords, query, query_label } = searchParamsResult;
  const cookieList = await getCookies({ cookies });

  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  const limit = appConfig?.search?.resultsLimit;

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
  };
});

export const generateMetadata = async ({
  params,
  searchParams,
}): Promise<Metadata> => {
  const [paramsResult, searchParamsResult] = await Promise.all([
    await params,
    await searchParams,
  ]);

  const {
    appConfig,
    i18n: { t },
    limit,
    locale,
    query,
    query_label,
  } = await getPageData(
    JSON.stringify(paramsResult),
    JSON.stringify(searchParamsResult),
  );

  const { results, totalResults } = await findResources(
    searchParamsResult,
    locale,
    parseInt((searchParamsResult?.page as string) ?? ''),
    limit,
  );

  const title = `${
    query_label || query || t('no_query', { ns: 'page-search' })
  } - ${totalResults?.toLocaleString()} ${t('results', { ns: 'page-search' })}`;

  const description = `Showing ${
    results.length >= 25 ? '25' : results.length
  } / ${totalResults} ${t('results_for')} ${query}.`;

  return {
    openGraph: {
      description,
      images: appConfig?.brand?.openGraphUrl
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

export default async function SearchPage({ params, searchParams }) {
  const device = getServerDevice((await headers()).get('user-agent')!);

  const [paramsResult, searchParamsResult] = await Promise.all([
    await params,
    await searchParams,
  ]);

  const {
    cookies,
    coords,
    i18n: { resources },
    limit,
    locale,
    location,
    query,
    query_label,
  } = await getPageData(
    JSON.stringify(paramsResult),
    JSON.stringify(searchParamsResult),
  );

  const { noResults, page, results, totalResults, filters } =
    await findResources(
      searchParamsResult,
      locale,
      parseInt((searchParamsResult?.page as string) ?? ''),
      limit,
    );

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
        results,
        totalResults,
      }}
    >
      <ResultsEvents results={results} totalResults={totalResults} />
      <div className="flex h-full w-full">
        <FilterPanel />
        <ResultsSection />
        <MapContainer />
      </div>
    </PageWrapper>
  );
}
