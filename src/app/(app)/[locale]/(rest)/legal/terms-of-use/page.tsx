import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { notFound } from 'next/navigation';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

const i18nNamespaces = ['common', 'page-404'];

export const generateMetadata = async ({ params }) => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  if (!appConfig.pages.termsOfUsePage.enabled) {
    return {
      robots: {
        index: false,
      },
      description: t('meta_description', { ns: 'page-404' }),
      title: t('meta_title', { ns: 'page-404' }),
    };
  }

  const title = appConfig.pages.termsOfUsePage.title;

  return {
    openGraph: {
      description: title,
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
    description: title,
    title,
  };
};

export default async function TermsOfUsePage({ params }) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  if (!appConfig.pages.termsOfUsePage.enabled) {
    notFound();
  }

  const cookieList = await getCookies({ cookies });
  const { t, resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <div className="container mx-auto pb-8 pt-8">
        <h1 className="mb-2 text-3xl font-bold">
          {appConfig.pages.termsOfUsePage.title}
        </h1>
        <div
          dangerouslySetInnerHTML={{
            __html: appConfig.pages.termsOfUsePage.content ?? '',
          }}
        />
      </div>
    </PageWrapper>
  );
}
