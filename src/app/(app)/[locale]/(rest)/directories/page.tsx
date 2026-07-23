import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { DirectoriesList } from '@/app/(app)/features/printable-directories/components/directories-list';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getPrintableDirectories } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectories';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { canAccessPrintableDirectories } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { createLogger } from '@/lib/logger';

const i18nNamespaces = ['page-directories', 'common'];
const log = createLogger('printable-directories-page');

type DirectoriesPageProps = {
  params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const title = t('meta_title', { ns: 'page-directories' });
  const description = t('meta_description', { ns: 'page-directories' });

  return {
    title,
    description,
  };
};

export default async function PrintableDirectoriesPage({
  params,
}: DirectoriesPageProps) {
  const session = await getSession();
  const cookieList = await getCookies({ cookies });

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const { locale } = await params;

  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  if (!session || session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent('/directories')}`,
    );
  }

  const hasAccess = canAccessPrintableDirectories(
    session.user?.email,
    appConfig,
  );

  if (!hasAccess) {
    redirect(`/${locale}`);
  }

  let initialLoadError = false;

  const { items } = await getPrintableDirectories(appConfig.tenantId).catch(
    (error) => {
      initialLoadError = true;
      log.error({ err: error }, 'Error fetching printable directories');
      return { items: [], page: 1, total: 0 };
    },
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <DirectoriesList
        locale={locale}
        initialDirectories={items}
        initialLoadError={initialLoadError}
      />
    </PageWrapper>
  );
}
