import { getAppConfig } from '@/app/shared/lib/appConfig';
import initTranslations from '@/app/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { CategoriesSection } from '@/app/features/home/components/categories-section';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/app/shared/components/page-wrapper';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { getServerDevice } from '@/app/shared/lib/get-server-device';

const i18nNamespaces = ['common', 'dynamic', 'categories'];

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

export default async function TopicsView({ params }) {
  const appConfig = getAppConfig();

  const { locale } = await params;
  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  const cookieList = await getCookies({ cookies });

  const device = getServerDevice((await headers()).get('user-agent')!);

  if (!appConfig?.newLayout?.enabled) {
    redirect('/');
  }

  return (
    <PageWrapper
      cookies={cookieList}
      jotaiData={{ device }}
      translationData={{ i18nNamespaces, locale, resources }}
    >
      <div className="container">
        <CategoriesSection
          backText={t('topics_page.backText', { ns: 'dynamic' })}
        />
      </div>
    </PageWrapper>
  );
}
