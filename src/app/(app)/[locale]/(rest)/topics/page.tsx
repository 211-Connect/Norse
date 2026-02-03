import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { Metadata } from 'next/types';
import { CategoriesSection } from '@/app/(app)/features/home/components/categories-section';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { getServerDevice } from '@/app/(app)/shared/lib/get-server-device';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

const i18nNamespaces = ['common'];

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

export default async function TopicsView({ params }) {
  const { locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);

  const { t, resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const cookieList = await getCookies({ cookies });

  const device = getServerDevice((await headers()).get('user-agent')!);

  if (!appConfig.newLayout?.enabled) {
    redirect('/');
  }

  return (
    <PageWrapper
      cookies={cookieList}
      jotaiData={{ device }}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <div className="container">
        <CategoriesSection backText={appConfig.topics.backText} />
      </div>
    </PageWrapper>
  );
}
