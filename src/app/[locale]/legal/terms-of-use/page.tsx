import { getAppConfig } from '@/app/shared/lib/appConfig';
import initTranslations from '@/app/shared/i18n/i18n';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { notFound } from 'next/navigation';
import { getCookies } from 'cookies-next/server';
import { cookies } from 'next/headers';

const i18nNamespaces = ['common', 'page-404', 'dynamic'];

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const appConfig = getAppConfig();

  return (
    appConfig?.nextConfig?.i18n?.locales?.map((locale: string) => ({
      locale,
    })) || []
  );
}

export const generateMetadata = async ({ params }) => {
  const appConfig = getAppConfig();
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  if (!appConfig?.pages?.termsOfUse?.enabled) {
    return {
      robots: {
        index: false,
      },
      description: t('meta_description', { ns: 'page-404' }),
      title: t('meta_title', { ns: 'page-404' }),
    };
  }

  const title = t('terms_of_use.title', { ns: 'dynamic' });

  return {
    openGraph: {
      description: title,
      images: appConfig?.brand?.openGraphUrl
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
  const appConfig = getAppConfig();

  if (!appConfig?.pages?.termsOfUse?.enabled) {
    notFound();
  }

  const { locale } = await params;
  const cookieList = await getCookies({ cookies });
  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <div className="container mx-auto pb-8 pt-8">
        <h1 className="mb-2 text-3xl font-bold">
          {t('terms_of_use.title', { ns: 'dynamic' })}
        </h1>
        <div
          dangerouslySetInnerHTML={{
            __html: t('terms_of_use.content', { ns: 'dynamic' }),
          }}
        />
      </div>
    </PageWrapper>
  );
}
