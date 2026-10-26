import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next/types';
import { cache } from 'react';

import { PrintableDirectoryDetail } from '@/app/(app)/features/printable-directories/components/printable-directory-detail';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { getPrintableDirectoryById } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectoryById';
import { getTranslationAllowance } from '@/app/(app)/shared/services/translation-usage/translation-usage-service';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { canAccessPrintableDirectories } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { getPrintableDirectoryServerAccess } from '@/app/(app)/shared/utils/printableDirectoryServerAccess';

const i18nNamespaces = ['page-directories', 'page-list', 'common'];

/** Shared by the metadata and the page, so the directory is fetched once. */
const getDirectory = cache(getPrintableDirectoryById);

type DirectoryDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const generateMetadata = async ({
  params,
}: DirectoryDetailPageProps): Promise<Metadata> => {
  const { locale, id } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );
  // null without access, so a directory's name is never leaked.
  const directory = await getDirectory(id, appConfig.tenantId);
  const listTitle = t('meta_title', { ns: 'page-directories' });
  const title = directory ? `${directory.name} - ${listTitle}` : listTitle;
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

  const directory = await getDirectory(id, appConfig.tenantId);
  if (!directory) {
    notFound();
  }

  const translationPausedReason = await getTranslationPausedReason(
    appConfig.tenantId,
    locale,
  );

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <PrintableDirectoryDetail
        locale={locale}
        initialDirectory={directory}
        translationPausedReason={translationPausedReason}
      />
    </PageWrapper>
  );
}

/** Only users who auto-translate can have it paused. */
async function getTranslationPausedReason(
  tenantId: string,
  locale: string,
): Promise<'user_quota' | 'tenant_cap' | undefined> {
  const access = await getPrintableDirectoryServerAccess(tenantId, locale);
  if (!access?.hasCapability('automaticTranslation')) {
    return undefined;
  }

  try {
    const allowance = await getTranslationAllowance(tenantId, access.userEmail);
    return allowance.allowed ? undefined : allowance.reason;
  } catch {
    return undefined;
  }
}
