import { GetStaticPropsContext } from 'next';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { TermsOfUseView } from '@/features/terms-of-use/views/terms-of-use-view';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const { appConfig } = await serverSideAppConfig();

  if (!appConfig?.pages?.termsOfUse?.enabled) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      ...{ appConfig },
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string)),
    },
  };
}

export default TermsOfUseView;
