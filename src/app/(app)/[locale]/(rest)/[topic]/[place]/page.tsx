import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';

import { LandingAnalytics } from '@/app/(app)/features/landing-pages/components/landing-analytics';
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
import { localizedLandingHref } from '@/app/(app)/features/landing-pages/lib/slugs';
import {
  getLandingContent,
  getLandingResults,
  landingOrigin,
  resolveLandingRequest,
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
  params: Promise<{ locale: string; topic: string; place: string }>;
  searchParams: Promise<RawSearchParams>;
};

export const generateMetadata = async ({
  params,
  searchParams,
}: Props): Promise<Metadata> => {
  const [{ locale, topic, place }, rawParams] = await Promise.all([
    params,
    searchParams,
  ]);
  await protectPage(`/${locale}/${topic}/${place}`);
  const { appConfig, page } = await resolveLandingRequest({
    locale,
    topic,
    place,
    searchParams: rawParams,
  });
  const [{ copy }, origin] = await Promise.all([
    getLandingContent(appConfig, page, locale),
    landingOrigin(appConfig),
  ]);
  const refined = isRefinedRequest(rawParams);
  const { canonical, languages } = landingAlternates({
    origin,
    locale,
    defaultLocale: appConfig.i18n.defaultLocale,
    alternates: page.alternates,
    // A refined variant points to the plain page.
    page: refined ? 1 : requestedPage(rawParams),
  });

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical, languages },
    // Only ever adds `noindex`: a deployment that blocks crawlers keeps the
    // layout's `noindex, nofollow` (an explicit `robots` would replace it).
    ...(refined &&
      !shouldBlockCrawlers(false) && {
        robots: { index: false, follow: true },
      }),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      type: 'website',
      images: appConfig.brand.openGraphUrl
        ? [{ url: appConfig.brand.openGraphUrl }]
        : undefined,
    },
  };
};

export default async function LandingPage({ params, searchParams }: Props) {
  const [{ locale, topic, place }, rawParams, cookieList] = await Promise.all([
    params,
    searchParams,
    getCookies({ cookies }),
  ]);

  // Before any data fetch or streaming, so a denial is a real 403.
  await protectPage(`/${locale}/${topic}/${place}`);

  const { appConfig, page } = await resolveLandingRequest({
    locale,
    topic,
    place,
    searchParams: rawParams,
  });
  const content = await getLandingContent(appConfig, page, locale);
  const [results, { resources }, origin, headersList] = await Promise.all([
    getLandingResults(appConfig, page, locale, rawParams),
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
  const path = localizedLandingHref(
    page.path,
    locale,
    appConfig.i18n.defaultLocale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      search={{
        region: searchQuery.region,
        location: searchQuery.location,
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
          __html: breadcrumbJsonLd(content.crumbs, origin, path),
        }}
      />
      <LandingAnalytics pageId={String(page.id)} />
      <ResultsEvents
        results={results.results}
        totalResults={results.totalResults}
        landingPageId={String(page.id)}
      />
      <LandingSearchProvider params={results.base} path={path}>
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
                crumbs={content.crumbs}
                crumbsLabel={content.labels.breadcrumbs}
                h1={content.copy.h1}
                intro={content.copy.intro}
              />
            }
            resultsFooter={
              <LandingPlaces
                heading={content.childrenHeading}
                places={content.children}
              />
            }
          />
        </SearchResultsProvider>
      </LandingSearchProvider>
    </PageWrapper>
  );
}
