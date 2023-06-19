import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CategorySection } from '../components/organisms/CategorySection';
import { HomePageLayout } from '../components/layouts/HomePage';
import { TourProvider } from '@reactour/tour';
import { AppFooter } from '../components/organisms/AppFooter';
import { DataProviders } from '../components/molecules/DataProviders';
import { AppHeader } from '../components/organisms/AppHeader';
import { HeroSection } from '../components/organisms/HeroSection';
import { useTranslation } from 'next-i18next';
import { useSession } from 'next-auth/react';

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
  const session = useSession();

  if (session.status === 'loading') return null;

  return (
    <TourProvider steps={[]} scrollSmooth>
      <HomePageLayout
        metaTitle={t('meta_title') || t('meta_title', { ns: 'dynamic' })}
        metaDescription={
          t('meta_description') || t('meta_description', { ns: 'dynamic' })
        }
        headerSection={<AppHeader />}
        heroSection={<HeroSection />}
        categorySection={<CategorySection />}
        footerSection={
          <AppFooter>
            <DataProviders />
          </AppFooter>
        }
      />
    </TourProvider>
  );
}
