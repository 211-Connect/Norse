import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { HomeView } from '../features/home/views/home-view';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-home',
        'common',
        'dynamic',
      ])),
    },
  };
}

export default HomeView;
