import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/organisms/AppHeader';
import { AppFooter } from '../../components/organisms/AppFooter';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { PluginLoader } from '../../components/molecules/PluginLoader';
import { FavoritesPageLayout } from '../../components/layouts/FavoritesPage';
import { FavoritesSection } from '../../components/organisms/FavoritesSection';
import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import { getServerSideAxios } from '../../lib/server/axios';
import { useTranslation } from 'next-i18next';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  let viewingAsOwner = false;

  const axios = getServerSideAxios(ctx, session);
  const favoritesAdapter = new FavoriteAdapter(axios);
  let data;
  if (!session) {
    data = await favoritesAdapter.getFavoriteList(ctx?.params?.id ?? '');
  } else if (session.error) {
    console.log(session.error);
    return {
      redirect: {
        destination: `/${ctx.locale}/auth/signin?redirect=${encodeURIComponent(
          '/favorites'
        )}`,
        permanent: false,
      },
    };
  } else {
    const axios = getServerSideAxios(ctx, session);
    favoritesAdapter.setAxiosInstance(axios);
    data = await favoritesAdapter.getFavoriteList(ctx?.params?.id ?? '');
    viewingAsOwner = true;
  }

  return {
    props: {
      session,
      favoriteList: data,
      viewingAsOwner,
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-list',
        'common',
      ])),
    },
  };
}

export default function FavoritesDetail({ favoriteList, viewingAsOwner }: any) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-list');

  return (
    <FavoritesPageLayout
      metaTitle={`${t('meta_title')} - ${favoriteList.name}`}
      metaDescription={`${t('meta_title')} - ${favoriteList.name}`}
      headerSection={<AppHeader fullWidth />}
      favoritesListSection={
        <FavoritesSection
          favoriteList={favoriteList}
          viewingAsOwner={viewingAsOwner}
        />
      }
      mapSection={
        <PluginLoader
          plugin={appConfig?.features?.map?.plugin}
          component="map"
          locations={favoriteList.favorites}
        />
      }
      footerSection={<AppFooter fullWidth />}
    />
  );
}
