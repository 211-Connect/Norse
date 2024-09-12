import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { HomeView } from '../features/home/views/home-view';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
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
