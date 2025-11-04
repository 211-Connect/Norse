import { CategoriesSection } from '@/features/home/components/categories-section';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

export function TopicsView() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('dynamic');

  return (
    <>
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />

        <meta property="og:title" content={t('meta_title')} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={t('meta_description')} />
      </Head>
      <div className="container">
        <CategoriesSection backText={t('topics_page.backText')} />
      </div>
    </>
  );
}
