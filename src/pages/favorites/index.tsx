import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { ListView } from '@/features/favorites/views/list-view';
import { FavoriteService } from '@/shared/services/favorite-service';

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

  let data = [];
  try {
    data = await FavoriteService.getFavoriteLists({ ctx });
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
