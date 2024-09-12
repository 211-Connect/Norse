import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext } from 'next';
import { InternalServerError } from '@/features/error/views/internal-server-error';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideAppConfig()),
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx?.locale ?? 'en', [
        'page-500',
        'common',
      ])),
    },
  };
}

export default InternalServerError;
