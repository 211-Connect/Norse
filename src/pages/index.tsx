import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { HomeView } from '../features/home/views/home-view';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { parseCookies } from 'nookies';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
} from '@/shared/lib/constants';
import { shake } from 'radash';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = parseCookies(ctx);
  const coords = cookies[USER_PREF_COORDS];
  const location = cookies[USER_PREF_LOCATION];
  const distance = cookies[USER_PREF_DISTANCE];

  const pageProps = shake({
    coords,
    location,
    distance,
  });

  return {
    props: {
      ...pageProps,
      ...(await serverSideAppConfig()),
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-home',
        'common',
        'dynamic',
        'categories',
        'suggestions',
      ])),
    },
  };
}

export default HomeView;
