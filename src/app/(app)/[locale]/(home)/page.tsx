import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { Metadata } from 'next/types';

import { HomePageBody } from '@/app/(app)/features/home/components/home-page-body';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';

import { getAppConfigWithoutHost } from '../../shared/utils/appConfig';

const i18nNamespaces = ['page-home', 'page-directories', 'common', 'page-list'];

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
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  const appConfig = await getAppConfigWithoutHost(locale);

  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  const cookieList = await getCookies({ cookies });

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <HomePageBody locale={locale} />
    </PageWrapper>
  );
}
