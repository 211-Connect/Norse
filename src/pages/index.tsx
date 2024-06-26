import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CategorySection } from '../components/home/categories';
import { TourProvider } from '@reactour/tour';
import { AppFooter } from '../components/app-footer';
import { DataProviders } from '../components/app-footer/components/data-providers';
import { AppHeader } from '../components/app-header';
import { HeroSection } from '../components/home/hero-section';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useAppConfig } from '@/hooks/use-app-config';
import { serverSideAppConfig } from '@/lib/server-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import Alert from '@/components/home/alert';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  return {
    props: {
      session,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale, [
        'page-home',
        'common',
        'categories',
        'suggestions',
        'menus',
      ])),
    },
  };
}

export default function Home() {
  const { t } = useTranslation('page-home');
  const appConfig = useAppConfig();

  const metaTitle = t('meta_title') || t('meta_title');
  const metaDescription = t('meta_description') || t('meta_description');

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
      <Alert />
      <CategorySection />
      <AppFooter>
        <DataProviders />
      </AppFooter>
    </TourProvider>
  );
}
