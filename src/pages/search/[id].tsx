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
  let data = null;

  try {
    const locale = ctx?.locale ?? ctx.defaultLocale;
    data = await ResourceService.getResource(ctx.query.id as string, {
      locale,
    });
  } catch (err) {
    if (isAxiosError(err)) {
      if (err?.response?.status === 404) {
        if (err.response.data.redirect) {
          return {
            redirect: {
              destination: `/${ctx.locale}${err.response.data.redirect}`,
              permanent: true,
            },
          };
        }

        return {
          redirect: {
            destination: `/${ctx.locale}`,
            permanent: false,
          },
        };
      }
    } else {
      console.error(err);
    }
  }

  // cacheControl(ctx);

  console.log(data);

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
  };
}

export default ResourceView;
