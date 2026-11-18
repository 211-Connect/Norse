import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { HomePageBody } from '@/app/(app)/features/home/components/home-page-body';
import { SearchLanding } from '@/app/(app)/features/search/components/search-landing';
import { SeoResults } from '@/app/(app)/features/search/components/seo-results';
import {
  liftQueryString,
  serializeSearchUrl,
} from '@/app/(app)/features/search/intent';
import {
  isDirectResultsLink,
  resultsUrlFor,
} from '@/app/(app)/features/search/v2/landing';
import { V2SeedProvider } from '@/app/(app)/features/search/v2/use-v2-search';
import {
  showsResultsView,
  v2CallString,
} from '@/app/(app)/features/search/v2/v2-seed';
import { fetchV2Server } from '@/app/(app)/features/search/v2/v2-server';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

type Raw = Record<string, string | string[] | undefined>;

const i18nNamespaces = [
  'page-search',
  'page-resource',
  'page-list',
  'common',
  'page-home',
  'page-directories',
];

const toQueryString = (raw: Raw) =>
  new URLSearchParams(
    Object.entries(raw).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value ?? '']).map(
        (v) => [key, v] as [string, string],
      ),
    ),
  );

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  return {
    title: `Find help | ${appConfig.meta.title || appConfig.brand.name || ''}`,
    description: appConfig.meta.description,
  };
};

/**
 * Prototype: the landing page, before the results page. A link that already names its results
 * (a taxonomy or an organization) goes to the results page unchanged; anything else asks first.
 */
export default async function FindPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Raw>;
}) {
  const [{ locale }, raw, cookieList] = await Promise.all([
    params,
    searchParams,
    getCookies({ cookies }),
  ]);
  const search = toQueryString(raw);

  if (isDirectResultsLink(search)) {
    const { intent, envelope } = liftQueryString(search.toString());
    redirect(serializeSearchUrl(intent, envelope));
  }

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  const first = (key: string) => search.get(key) ?? undefined;

  // Q4 (v2-search--seo-urls): a plain search URL shows results, server-rendered, the same for a
  // bot and a person. The questions come with `refine=1`. If the call fails, the page renders
  // the landing as before.
  if (showsResultsView(search)) {
    const call = new URLSearchParams(search);
    call.set('locale', locale);
    const data = await fetchV2Server(call, appConfig.tenantId);
    if (data) {
      const withRefine = new URLSearchParams(search);
      withRefine.set('refine', '1');
      return (
        <PageWrapper
          cookies={cookieList}
          translationData={{ i18nNamespaces, locale, resources }}
          search={{
            query: first('query'),
            queryLabel: first('query_label'),
            location: first('location'),
            coords: first('coords'),
            distance: first('distance'),
          }}
          nonce={nonce}
        >
          <V2SeedProvider
            seed={{
              tenantId: appConfig.tenantId,
              callString: v2CallString(search),
              data,
              fetchedAt: Date.now(),
            }}
          >
            <SeoResults
              data={data}
              query={(first('query_label') ?? first('query') ?? '').trim()}
              refineHref={`/find?${withRefine}`}
              allResultsHref={resultsUrlFor(
                search.toString(),
                appConfig.search.searchEngine,
              )}
            />
          </V2SeedProvider>
        </PageWrapper>
      );
    }
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      search={{
        query: first('query'),
        queryLabel: first('query_label'),
        location: first('location'),
        coords: first('coords'),
        distance: first('distance'),
      }}
      nonce={nonce}
    >
      <HomePageBody locale={locale} />
      <SearchLanding />
    </PageWrapper>
  );
}
