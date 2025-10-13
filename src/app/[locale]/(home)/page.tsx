import initTranslations from '@/app/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import { TourProvider } from '@/app/shared/context/tour-provider';
import { HeroSection } from '@/app/features/home/components/hero-section';
import Alert from '@/app/features/home/components/alert';
import { CategoriesSection } from '@/app/features/home/components/categories-section';
import { DataProviders } from '@/app/shared/components/data-providers';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { cookies, headers } from 'next/headers';
import { getServerDevice } from '@/app/shared/lib/get-server-device';
import { getCookies } from 'cookies-next/server';

import { NewHomeContent } from '../../features/home/components/new-home-content';

const i18nNamespaces = [
  'page-home',
  'common',
  'dynamic',
  'categories',
  'suggestions',
];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const appConfig = getAppConfig();
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  return {
    openGraph: {
      description: t('meta_description', { ns: 'dynamic' }),
      images: appConfig?.brand?.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title: t('meta_title', { ns: 'dynamic' }),
    },
    description: t('meta_description', { ns: 'dynamic' }),
    title: t('meta_title', { ns: 'dynamic' }),
  };
};

export default async function HomePage({ params }) {
  const { locale } = await params;
  const appConfig = getAppConfig();
  const { resources } = await initTranslations(locale, i18nNamespaces);
  const cookieList = await getCookies({ cookies });

  const device = getServerDevice((await headers()).get('user-agent')!);

  return (
    <PageWrapper
      cookies={cookieList}
      jotaiData={{ device }}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <TourProvider>
        {appConfig?.newLayout?.enabled ? (
          <NewHomeContent />
        ) : (
          <>
            <HeroSection />
            <Alert />

            <CategoriesSection className="py-8" />

            <DataProviders />
          </>
        )}
      </TourProvider>
    </PageWrapper>
  );
}
