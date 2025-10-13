import { notFound } from 'next/navigation';
import initTranslations from '@/app/shared/i18n/i18n';

const i18nNamespaces = ['common', 'page-404', 'dynamic'];

export const generateMetadata = async ({ params }) => {
  const { locale } = await params;
  const { t } = await initTranslations(locale, i18nNamespaces);

  return {
    description: t('meta_description', { ns: 'page-404' }),
    title: t('meta_title', { ns: 'page-404' }),
  };
};

export default async function CatchAllPage() {
  notFound();
}
