import initTranslations from '@/app/shared/i18n/i18n';
import { getSession } from '@/auth';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { getFavoriteLists } from '@/app/shared/services/favorite-service';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';
import { FavoriteListsSection } from '@/app/features/favorites/components/favorite-lists-section';
import { MapContainer } from '@/app/features/favorites/components/map-container';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';
import { SESSION_ID } from '@/app/shared/lib/constants';

const i18nNamespaces = ['page-favorites', 'common', 'dynamic'];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  return {
    title: t('meta_title', { ns: 'page-favorites' }),
    description: t('meta_description', { ns: 'page-favorites' }),
  };
};

export default async function FavoritesPage({ params }) {
  const session = await getSession();
  const cookieList = await getCookies({ cookies });

  const { locale } = await params;
  const { resources } = await initTranslations(locale, i18nNamespaces);

  if (!session || session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  }

  let favoriteLists = [];
  try {
    favoriteLists = await getFavoriteLists(cookieList[SESSION_ID]);
  } catch (err) {
    console.error(err);
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      session={session}
      jotaiData={{ favoriteLists }}
    >
      <div className="flex flex-1">
        <FavoriteListsSection />
        <MapContainer />
      </div>
    </PageWrapper>
  );
}
