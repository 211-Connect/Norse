import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { getServerDevice } from '@/shared/lib/get-server-device';
import { TopicsView } from '@/features/topics/views/topics-view';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const device = getServerDevice(ctx.req.headers['user-agent']);

  const appConfig = await serverSideAppConfig();

  if (!appConfig?.appConfig?.newLayout?.enabled) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      device,
      ...appConfig,
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'common',
        'dynamic',
        'categories',
      ])),
    },
  };
}

export default TopicsView;
