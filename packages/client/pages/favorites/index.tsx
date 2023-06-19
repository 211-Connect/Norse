import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { AppHeader } from '../../components/organisms/AppHeader';
import { AppFooter } from '../../components/organisms/AppFooter';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { PluginLoader } from '../../components/molecules/PluginLoader';
import { FavoriteListsPageLayout } from '../../components/layouts/FavoriteListsPage';
import { FavoriteListSection } from '../../components/organisms/FavoriteListSection';
import { getServerSideAxios } from '../../lib/server/axios';
import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import { useTranslation } from 'next-i18next';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session || session.error) {
    return {
      redirect: {
        destination: `/auth/signin?redirect=${encodeURIComponent(
          '/favorites'
        )}`,
        permanent: false,
      },
    };
  }

  const axios = await getServerSideAxios(ctx, session);
  const favoritesAdapter = new FavoriteAdapter(axios);
  const data = await favoritesAdapter.getFavoriteLists();

  return {
    props: {
      session,
      favoriteLists: data,
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-favorites',
        'common',
      ])),
    },
  };
}

export default function Lists({ favoriteLists }: any) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-favorites');

  return (
    <FavoriteListsPageLayout
      title={t('meta_title')}
      metaDescription={t('meta_description')}
      headerSection={<AppHeader fullWidth />}
      favoriteListSection={
        <FavoriteListSection favoriteLists={favoriteLists} />
      }
      mapSection={
        <PluginLoader
          plugin={appConfig?.features?.map?.plugin}
          component="map"
          locations={[]}
        />
      }
      footerSection={<AppFooter fullWidth />}
    />
  );
}
