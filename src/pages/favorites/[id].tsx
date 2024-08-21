import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { FavoritesView } from '@/features/favorites/views/favorites-view';
import { FavoriteService } from '@/shared/services/favorite-service';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  let viewingAsOwner = false;

  let data;
  if (!session) {
    data = await FavoriteService.getFavoriteList(ctx?.params?.id ?? '', {
      ctx,
    });
  } else if (session.error) {
    console.log(session.error);
    return {
      redirect: {
        destination: `/${ctx.locale}/auth/signin?redirect=${encodeURIComponent(
          '/favorites',
        )}`,
        permanent: false,
      },
    };
  } else {
    data = await FavoriteService.getFavoriteList(ctx?.params?.id ?? '', {
      ctx,
    });
    viewingAsOwner = true;
  }

  return {
    props: {
      session,
      favoriteList: data,
      viewingAsOwner,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-list',
        'common',
      ])),
    },
  };
}

export default FavoritesView;
