import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticPropsContext } from 'next';
import { NotFound } from '@/features/error/views/not-found';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideAppConfig()),
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx?.locale ?? 'en')),
    },
  };
}

export default NotFound;
