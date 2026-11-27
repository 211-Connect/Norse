import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';

import { LandingHeader } from '@/app/(app)/features/landing-pages/components/landing-header';
import { LandingPlaces } from '@/app/(app)/features/landing-pages/components/landing-places';
import { LandingSearchProvider } from '@/app/(app)/features/landing-pages/components/landing-search-provider';
import {
  isRefinedRequest,
  requestedPage,
} from '@/app/(app)/features/landing-pages/lib/search';
import {
  breadcrumbJsonLd,
  landingAlternates,
} from '@/app/(app)/features/landing-pages/lib/seo';
import {
  getLandingHub,
  getLandingResults,
  landingOrigin,
} from '@/app/(app)/features/landing-pages/server/landing-page-data';
import { ResultsEvents } from '@/app/(app)/features/search/components/results-events';
import { SearchPageShell } from '@/app/(app)/features/search/components/search-page-shell';
import { SearchResultsProvider } from '@/app/(app)/features/search/context/search-results-context';
import { type RawSearchParams } from '@/app/(app)/features/search/intent';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { shouldBlockCrawlers } from '@/app/(app)/shared/utils/shouldBlockCrawlers';
import { protectPage } from '@/lib/arcjet-page';

const i18nNamespaces = ['page-search', 'page-resource', 'page-list', 'common'];

type Props = {
  params: Promise<{ locale: string; topic: string }>;
  searchParams: Promise<RawSearchParams>;
};

/**
 * `/{topic-slug}`: the topic's services across the tenant, with links to its
 * state (or county) pages (docs/landing-pages.md, "Topic hub").
 */
export const generateMetadata = async ({
  params,
  searchParams,
}: Props): Promise<Metadata> => {
  const [{ locale, topic }, rawParams] = await Promise.all([
    params,
    searchParams,
  ]);
  await protectPage(`/${locale}/${topic}`);
  const {
    appConfig,
    topic: topicView,
    alternates,
  } = await getLandingHub(locale, topic);
  const origin = await landingOrigin(appConfig);
  const refined = isRefinedRequest(rawParams);
  const title = `${topicView.name} | ${appConfig.brand.name}`;
  const { canonical, languages } = landingAlternates({
    origin,
    locale,
    defaultLocale: appConfig.i18n.defaultLocale,
    alternates,
    page: refined ? 1 : requestedPage(rawParams),
  });
  return {
    title,
    alternates: { canonical, languages },
    // Only ever adds `noindex`, as on the landing pages.
    ...(refined &&
      !shouldBlockCrawlers(false) && {
        robots: { index: false, follow: true },
      }),
    openGraph: {
      title,
      url: canonical,
      type: 'website',
      images: appConfig.brand.openGraphUrl
        ? [{ url: appConfig.brand.openGraphUrl }]
        : undefined,
    },
  };
};

export default async function LandingHubPage({ params, searchParams }: Props) {
  const [{ locale, topic }, rawParams, cookieList] = await Promise.all([
    params,
    searchParams,
    getCookies({ cookies }),
  ]);

  // Before any data fetch or streaming, so a denial is a real 403.
  await protectPage(`/${locale}/${topic}`);

  const hub = await getLandingHub(locale, topic);
  const { appConfig } = hub;
  const [results, { resources }, origin, headersList] = await Promise.all([
    getLandingResults(
      appConfig,
      { id: `hub:${topic}`, topic: hub.topic, region: null },
      locale,
      rawParams,
    ),
    initTranslations(
      locale,
      i18nNamespaces,
      appConfig.i18n.locales,
      appConfig.i18n.defaultLocale,
    ),
    landingOrigin(appConfig),
    headers(),
  ]);
  const nonce = headersList.get('x-nonce') ?? '';
  const { searchQuery } = results;

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      search={{
        query: searchQuery.query,
        queryLabel: searchQuery.queryLabel,
        queryType: searchQuery.queryType,
        fixedLocation: true,
      }}
      nonce={nonce}
    >
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd(hub.crumbs, origin, hub.path),
        }}
      />
      <ResultsEvents
        results={results.results}
        totalResults={results.totalResults}
      />
      <LandingSearchProvider params={results.base} path={hub.path}>
        <SearchResultsProvider
          value={{
            results: results.results,
            totalResults: results.listTotal,
            isTotalCapped: results.listTotal < results.totalResults,
            pinsQuery: results.pinsQuery,
            currentPage: results.currentPage,
            filters: results.filters,
            sort: searchQuery.sort ?? 'relevance',
            coordinates: searchQuery.coordinates ?? null,
            region: searchQuery.region ?? null,
          }}
        >
          <SearchPageShell
            searchIntent={results.intent}
            cardLayout={results.cardLayout}
            resultsHeader={
              <LandingHeader
                crumbs={hub.crumbs}
                crumbsLabel={hub.labels.breadcrumbs}
                h1={hub.topic.name}
                intro=""
              />
            }
            resultsFooter={
              <LandingPlaces heading={hub.labels.byRegion} groups={hub.areas} />
            }
          />
        </SearchResultsProvider>
      </LandingSearchProvider>
    </PageWrapper>
  );
}
