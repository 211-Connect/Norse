import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { TourProvider } from '@reactour/tour';
import { useAppConfig } from '@/lib/hooks/useAppConfig';
import Alert from '../components/alert';
import { HeroSection } from '../components/hero-section';
import { CategoriesSection } from '../components/categories-section';

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
      <Alert />
      <CategoriesSection />
    </TourProvider>
  );
}