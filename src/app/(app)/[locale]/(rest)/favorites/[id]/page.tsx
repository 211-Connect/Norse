import { Metadata } from 'next/types';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { FavoritesSection } from '@/app/(app)/features/favorites/components/favorites-section';
import { FavoriteMapContainer } from '@/app/(app)/features/favorites/components/favorite-map-container';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { getFavoriteList } from '@/app/(app)/shared/serverActions/favorites/getFavoriteList';

const i18nNamespaces = ['page-list', 'common'];

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
  } else if (session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  } else {
    favoriteList = await getFavoriteList(id, locale, appConfig.tenantId);
    viewingAsOwner = true;
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{ favoriteList, viewingAsOwner }}
    >
      <div className="flex flex-1">
        <FavoritesSection />
        <FavoriteMapContainer />
      </div>
    </PageWrapper>
  );
}
