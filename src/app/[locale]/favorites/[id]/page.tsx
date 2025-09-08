import { getSession } from '@/auth';
import { Metadata } from 'next/types';
import initTranslations from '@/app/shared/i18n/i18n';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import { getFavoriteList } from '@/app/shared/services/favorite-service';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { FavoritesSection } from '@/app/features/favorites/components/favorites-section';
import { FavoriteMapContainer } from '@/app/features/favorites/components/favorite-map-container';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';
import { SESSION_ID } from '@/app/shared/lib/constants';

const i18nNamespaces = ['page-list', 'common', 'dynamic'];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const appConfig = getAppConfig();

  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  const title = t('meta_title', { ns: 'page-list' });

  return {
    description: title,
    openGraph: {
      description: title,
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
    title,
  };
};

export default async function FavoritesDetailsPage({ params }) {
  const { id, locale } = await params;
  const cookieList = await getCookies({ cookies });

  const session = await getSession();
  const { resources } = await initTranslations(locale, i18nNamespaces);

  let viewingAsOwner = false;
  let favoriteList;

  if (!session) {
    favoriteList = await getFavoriteList(id, locale, cookieList[SESSION_ID]);
  } else if (session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  } else {
    favoriteList = await getFavoriteList(id, locale);
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
