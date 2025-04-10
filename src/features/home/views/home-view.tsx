'use client';
import { HeroSection } from '../components/hero-section';
import { CategoriesSection } from '../components/categories-section';
import { DataProviders } from '@/shared/components/data-providers';
import Alert from '../components/alert';

export function HomeView() {
  return (
    <>
      {/* <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />

        <meta property="og:title" content={t('meta_title')} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={t('meta_description')} />
      </Head> */}

      {/* <HeroSection /> */}
      <div className="bg-primary/5">
        <Alert />
        <CategoriesSection />
      </div>

      <DataProviders />
    </>
  );
}
