import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { MapContainer } from '../components/map-container';
import { FavoriteListsSection } from '../components/favorite-lists-section';

export function ListView() {
  const { t } = useTranslation('page-favorites');

  return (
    <>
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />
      </Head>
      <div className="flex flex-1">
        <FavoriteListsSection />
        <MapContainer />
      </div>
    </>
  );
}
