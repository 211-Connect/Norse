import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { createLogger } from '@/lib/logger';

import { LocalFavoritesWithMap } from '../../../../features/favorites/components/local-favorites-with-map';

const log = createLogger('local-favorites-page');

const i18nNamespaces = [
  'page-favorites',
  'page-list',
  'page-resource',
  'common',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return {
    title: t('meta_title', { ns: 'page-favorites' }),
    description: t('meta_description', { ns: 'page-favorites' }),
  };
}

export default async function LocalFavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const cookieList = await getCookies({ cookies });
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const cardLayout = appConfig.search.cardLayout ?? DEFAULT_SEARCH_CARD_LAYOUT;

  const session = await getSession();
  const hasValidSession = Boolean(session && !session.error);

  if (
    appConfig.featureFlags.requireAuthenticationForFavorites ||
    hasValidSession
  ) {
    log.debug(
      {
        hasSession: Boolean(session),
        sessionError: session?.error ?? null,
        hasValidSession,
        requireAuthenticationForFavorites:
          appConfig.featureFlags.requireAuthenticationForFavorites,
      },
      'Redirecting from /favorites/local',
    );

    redirect(`/${locale}/favorites`);
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <LocalFavoritesWithMap
        cardLayout={cardLayout}
        locale={locale}
        tenantId={appConfig.tenantId}
      />
    </PageWrapper>
  );
}
