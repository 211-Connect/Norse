import { notFound } from 'next/navigation';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
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

  return {
    description: t('meta_description', { ns: 'page-404' }),
    title: t('meta_title', { ns: 'page-404' }),
  };
};

export default async function CatchAllPage() {
  notFound();
}
