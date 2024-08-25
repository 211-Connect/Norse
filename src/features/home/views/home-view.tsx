import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { TourProvider } from '@reactour/tour';
import { HeroSection } from '../components/hero-section';
import { CategoriesSection } from '../components/categories-section';
import { DataProviders } from '@/shared/components/data-providers';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import Alert from '../components/alert';

export function HomeView() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  return (
    <TourProvider steps={[]} scrollSmooth>
      <Head>
        <title>{t('meta_title', { ns: 'dynamic' })}</title>
        <meta
          name="description"
          content={t('meta_description', { ns: 'dynamic' })}
        />

        <meta
          property="og:title"
          content={t('meta_title') || t('meta_title', { ns: 'dynamic' })}
        />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content={t('meta_description', { ns: 'dynamic' })}
        />
      </Head>

      <HeroSection />
      <div className="bg-primary/5">
        <Alert />

        <CategoriesSection />
      </div>

      <DataProviders />
    </TourProvider>
  );
}
