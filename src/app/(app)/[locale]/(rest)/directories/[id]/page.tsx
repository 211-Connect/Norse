import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next/types';

import { PrintableDirectoryDetail } from '@/app/(app)/features/printable-directories/components/printable-directory-detail';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getPrintableDirectoryById } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectoryById';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { canAccessPrintableDirectories } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';

const i18nNamespaces = ['page-directories', 'page-list', 'common'];

type DirectoryDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const generateMetadata = async ({
  params,
}: DirectoryDetailPageProps): Promise<Metadata> => {
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

export default async function PrintableDirectoryDetailPage({
  params,
}: DirectoryDetailPageProps) {
  const session = await getSession();
  const cookieList = await getCookies({ cookies });
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';

  const { locale, id } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  if (!session || session.error) {
    redirect(
      `/${locale}/auth/signin?redirect=${encodeURIComponent(`/directories/${id}`)}`,
    );
  }

  const hasAccess = canAccessPrintableDirectories(
    session.user?.email,
    appConfig,
  );
  if (!hasAccess) {
    redirect(`/${locale}`);
  }

  const directory = await getPrintableDirectoryById(id, appConfig.tenantId);
  if (!directory) {
    notFound();
  }

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <PrintableDirectoryDetail locale={locale} initialDirectory={directory} />
    </PageWrapper>
  );
}
