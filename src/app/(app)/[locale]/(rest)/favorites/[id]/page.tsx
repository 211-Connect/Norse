import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { FavoriteMapContainer } from '@/app/(app)/features/favorites/components/favorite-map-container';
import { FavoritesSection } from '@/app/(app)/features/favorites/components/favorites-section';
import { FavoriteListStateSync } from '@/app/(app)/features/favorites/components/favorites-state-sync';
import { DEFAULT_SEARCH_CARD_LAYOUT } from '@/app/(app)/features/search/types/card-layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { fetchFavoriteList } from '@/app/(app)/shared/serverActions/favorites/getFavoriteList';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { getTenantByHost } from '@/lib/cms/tenants';

const i18nNamespaces = [
  'common',
  'page-favorites',
  'page-list',
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

  if (session?.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/favorites')}`,
    );
  }

  const result = await fetchFavoriteList(id, locale, appConfig.tenantId);
  if (!result.ok) {
    // Anything other than "private" or "missing" is a real failure (API down,
    // 5xx): let the error boundary show the generic "try again later" page.
    if (
      result.status !== 401 &&
      result.status !== 403 &&
      result.status !== 404
    ) {
      throw new Error(
        `Failed to load favorite list ${id} (status ${result.status ?? 'unknown'})`,
      );
    }

    if (!session) {
      // A logged-out visitor may be the list's own owner, just not signed in
      // right now (this route is reachable without auth when `favorites-list`
      // is one of the tenant's public-page exceptions). Give them a chance to
      // sign in and retry instead of a dead-end 404.
      const host =
        headersList.get('x-forwarded-host') ||
        headersList.get('host') ||
        'localhost';
      const tenant = await getTenantByHost(parseHost(host));

      if (tenant?.auth?.requiresLogin) {
        redirect(
          `/${locale}/auth/signin?redirect=${encodeURIComponent(`/favorites/${id}`)}`,
        );
      }
    }

    // Private (and not ours) or deleted: the API doesn't let us tell these
    // apart reliably, so `./not-found.tsx` explains both possibilities.
    notFound();
  }

  const favoriteList = result.data;
  const viewingAsOwner = session?.user?.id === favoriteList.ownerId;

  const cardLayout = appConfig.search.cardLayout ?? DEFAULT_SEARCH_CARD_LAYOUT;

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <FavoriteListStateSync
        favoriteList={favoriteList}
        viewingAsOwner={viewingAsOwner}
      />
      <div className="flex flex-1">
        <FavoritesSection cardLayout={cardLayout} />
        <FavoriteMapContainer />
      </div>
    </PageWrapper>
  );
}
