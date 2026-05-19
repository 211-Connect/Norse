import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { FavoriteMapContainer } from '@/app/(app)/features/favorites/components/favorite-map-container';
import { FavoritesSection } from '@/app/(app)/features/favorites/components/favorites-section';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getFavoriteList } from '@/app/(app)/shared/serverActions/favorites/getFavoriteList';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';

const i18nNamespaces = [
  'page-favorites',
  'page-list',
  'common',
  'page-resource',
];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);

  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const title = t('meta_title', { ns: 'page-list' });

  return {
    description: title,
    openGraph: {
      description: title,
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
    title,
  };
};

export default async function FavoritesDetailsPage({ params }) {
  const { id, locale } = await params;
  const cookieList = await getCookies({ cookies });
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const session = await getSession();
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  let viewingAsOwner = false;
  let favoriteList;

  if (!session) {
    favoriteList = await getFavoriteList(id, locale, appConfig.tenantId);
    if (!favoriteList) {
      notFound();
    }
  } else if (session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  } else {
    favoriteList = await getFavoriteList(id, locale, appConfig.tenantId);
    if (!favoriteList) {
      notFound();
    }
    viewingAsOwner = true;
  }

  const cardLayout = appConfig.search.cardLayout ?? DEFAULT_SEARCH_CARD_LAYOUT;

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{ favoriteList, viewingAsOwner }}
      nonce={nonce}
    >
      <div className="flex flex-1">
        <FavoritesSection cardLayout={cardLayout} />
        <FavoriteMapContainer />
      </div>
    </PageWrapper>
  );
}
