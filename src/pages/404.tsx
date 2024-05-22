import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext } from 'next';
import ErrorPageLayout from '../components/layouts/ErrorPage';
import { AppHeader } from '../components/organisms/app-header';
import { AppFooter } from '../components/organisms/app-footer';
import { DataProviders } from '../components/molecules/data-providers';
import { useTranslation } from 'next-i18next';
import { useSession } from 'next-auth/react';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(ctx?.locale ?? 'en')),
    },
  };
}

export default function NotFound() {
  const { t } = useTranslation('page-404');
  const session = useSession();

  if (session.status === 'loading') return null;

  return (
    <ErrorPageLayout
      metaTitle={t('meta_title')}
      metaDescription={t('meta_description')}
      headerSection={<AppHeader />}
      title={t('title')}
      description={t('description')}
      footerSection={
        <AppFooter>
          <DataProviders />
        </AppFooter>
      }
      backgroundImage="/undraw_404.svg"
    />
  );
}
