import { useAppConfig } from '@/shared/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { FavoriteMapContainer } from '../components/favorite-map-container';
import { FavoritesSection } from '../components/favorites-section';

export function FavoritesView() {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();

  return (
    <>
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_title')} />
        <meta property="og:title" content={t('meta_title')} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={t('meta_title')} />
      </Head>
      <div className="flex flex-1">
        <FavoritesSection />
        <FavoriteMapContainer />
      </div>
    </>
  );
}
