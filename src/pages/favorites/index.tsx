import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { getServerSideAxios } from '../../lib/server/axios';
import { FavoriteAdapter } from '../../lib/adapters/FavoriteAdapter';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { ListView } from '@/features/favorites/views/list-view';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session || session.error) {
    return {
      redirect: {
        destination: `/${ctx.locale}/auth/signin?redirect=${encodeURIComponent(
          '/favorites',
        )}`,
        permanent: false,
      },
    };
  }

  const axios = getServerSideAxios(ctx, session);
  const favoritesAdapter = new FavoriteAdapter(axios);
  let data = [];
  try {
    data = await favoritesAdapter.getFavoriteLists();
  } catch (err) {
    console.error(err);
  }

  return {
    props: {
      session,
      favoriteLists: data,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-favorites',
        'common',
      ])),
    },
  };
}

export default ListView;

// export default function Lists({ favoriteLists }: any) {
//   const appConfig = useAppConfig();
//   const { t } = useTranslation('page-favorites');

//   return (
//     <FavoriteListsPageLayout
//       title={t('meta_title')}
//       metaDescription={t('meta_description')}
//       headerSection={<AppHeader fullWidth />}
//       favoriteListSection={
//         <FavoriteListSection favoriteLists={favoriteLists} />
//       }
//       mapSection={
//         <PluginLoader
//           plugin={appConfig?.features?.map?.plugin}
//           component="map"
//           locations={[]}
//         />
//       }
//       footerSection={<AppFooter fullWidth />}
//     />
//   );
// }
