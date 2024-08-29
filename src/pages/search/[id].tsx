import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isAxiosError } from 'axios';
import {
  cacheControl,
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { ResourceView } from '@/features/resource/views/resource-view';
import { ResourceService } from '@/shared/services/resource-service';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // const resourceAdapter = new ResourceAdapter(axios);
  let notFound = false;
  let data = null;

  try {
    data = await ResourceService.getResource(ctx.query.id as string);
  } catch (err) {
    if (isAxiosError(err)) {
      if (err?.response?.status === 404) {
        notFound = true;

        if (err.response.data.redirect) {
          return {
            redirect: {
              destination: `/${ctx.locale}${err.response.data.redirect}`,
              permanent: true,
            },
          };
        }
      }
    } else {
      console.error(err);
    }
  }

  cacheControl(ctx);

  return {
    props: {
      resource: data,
      ...(await serverSideAppConfig()),
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-resource',
        'common',
        'dynamic',
      ])),
    },
    notFound,
  };
}

export default ResourceView;
