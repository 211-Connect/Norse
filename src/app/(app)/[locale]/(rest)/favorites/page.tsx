import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';
import { FavoriteListsSection } from '@/app/(app)/features/favorites/components/favorite-lists-section';
import { MapContainer } from '@/app/(app)/features/favorites/components/map-container';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { getFavoriteLists } from '@/app/(app)/shared/serverActions/favorites/getFavoriteLists';
import { FavoritesPageProps } from '@/types/favorites';
import { createLogger } from '@/lib/logger';

const log = createLogger('favorites-page');

const i18nNamespaces = ['page-favorites', 'common'];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
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
};

export default async function FavoritesPage({
  params,
  searchParams,
}: FavoritesPageProps) {
  const session = await getSession();
  const cookieList = await getCookies({ cookies });

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const { locale } = await params;
  const { page, limit, search } = await searchParams;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  if (!session || session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  }

  const pageParam = Array.isArray(page) ? page[0] : page;
  const limitParam = Array.isArray(limit) ? limit[0] : limit;
  const searchParam = Array.isArray(search) ? search[0] : search;

  const { data: favoriteLists, totalCount: favoriteListsTotal } =
    await getFavoriteLists(
      appConfig.tenantId,
      Number(pageParam) || 1,
      Number(limitParam) || 10,
      searchParam || '',
    ).catch((err) => {
      log.error({ err }, 'Error fetching favorite lists');
      return { data: [], totalCount: 0 };
    });

  const currentPage = Number(pageParam) || 1;
  const limits = Number(limitParam) || 10;
  const maxPages = Math.ceil(favoriteListsTotal / limits);

  const getRedirectUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchParam) params.set('search', searchParam);
    if (limitParam) params.set('limit', String(limitParam));
    params.set('page', String(newPage));
    return `/${locale}/favorites?${params.toString()}`;
  };

  if (favoriteListsTotal > 0 && currentPage > maxPages) {
    redirect(getRedirectUrl(maxPages));
  }

  if (currentPage <= 0) {
    redirect(getRedirectUrl(1));
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      jotaiData={{
        favoriteLists,
        favoriteListsTotal,
        favoriteListsCurrentPage: currentPage,
      }}
      nonce={nonce}
    >
      <div className="flex flex-1">
        <FavoriteListsSection />
        <MapContainer />
      </div>
    </PageWrapper>
  );
}
