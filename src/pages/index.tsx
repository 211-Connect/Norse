import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CategorySection } from '../components/organisms/category-section';
import { TourProvider } from '@reactour/tour';
import { AppFooter } from '../components/organisms/app-footer';
import { DataProviders } from '../components/molecules/data-providers';
import { AppHeader } from '../components/organisms/app-header';
import { HeroSection } from '../components/organisms/hero-section';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-home',
        'common',
        'dynamic',
      ])),
    },
  };
}

export default function Home() {
  const { t } = useTranslation('page-home');
  const appConfig = useAppConfig();

  const metaTitle = t('meta_title') || t('meta_title', { ns: 'dynamic' });
  const metaDescription =
    t('meta_description') || t('meta_description', { ns: 'dynamic' });

  return (
    <TourProvider steps={[]} scrollSmooth>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={metaDescription} />
      </Head>
      <AppHeader />
      <HeroSection />
      <CategorySection />
      <AppFooter>
        <DataProviders />
      </AppFooter>
    </TourProvider>
  );
}
