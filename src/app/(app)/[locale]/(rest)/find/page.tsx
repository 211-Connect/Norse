import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { SearchLanding } from '@/app/(app)/features/search/components/search-landing';
import {
  liftQueryString,
  serializeSearchUrl,
} from '@/app/(app)/features/search/intent';
import { isDirectResultsLink } from '@/app/(app)/features/search/v2/landing';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

type Raw = Record<string, string | string[] | undefined>;

const i18nNamespaces = ['page-search', 'page-resource', 'page-list', 'common'];

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
      <SearchLanding />
    </PageWrapper>
  );
}
