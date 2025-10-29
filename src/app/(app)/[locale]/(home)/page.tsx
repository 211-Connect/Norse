import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { TourProvider } from '@/app/(app)/shared/context/tour-provider';
import { HeroSection } from '@/app/(app)/features/home/components/hero-section';
import Alert from '@/app/(app)/features/home/components/alert';
import { CategoriesSection } from '@/app/(app)/features/home/components/categories-section';
import { DataProviders } from '@/app/(app)/shared/components/data-providers';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { cookies, headers } from 'next/headers';
import { getServerDevice } from '@/app/(app)/shared/lib/get-server-device';
import { getCookies } from 'cookies-next/server';

import { NewHomeContent } from '../../features/home/components/new-home-content';
import { getAppConfigWithoutHost } from '../../shared/utils/appConfig';

const i18nNamespaces = ['page-home', 'common'];

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);

  const description = appConfig.meta.description;
  const title = appConfig.meta.title;

  return {
    openGraph: {
      description,
      images: appConfig.brand.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title,
    },
    description,
    title,
  };
};

export default async function HomePage({ params }) {
  const { locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);

  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
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
