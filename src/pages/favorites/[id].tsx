import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { PluginLoader } from '../../components/molecules/plugin-loader';
import { FavoritesPageLayout } from '../../components/layouts/FavoritesPage';
import { FavoritesSection } from '../../components/favorites-section';
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
          locations={favoriteList.favorites.map((el: any) => ({
            id: el._id,
            name: el.displayName,
            description: el?.translations?.[0]?.serviceDescription,
            location: el.location,
            website: el.website,
            phone: el?.phoneNumbers?.find(
              (el: any) => el.rank === 1 && el.type === 'voice'
            ),
          }))}
        />
      }
      footerSection={<AppFooter fullWidth />}
    />
  );
}
