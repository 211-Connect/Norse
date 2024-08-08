import { GetStaticPropsContext } from 'next';
import { serverSideAppConfig } from '@/shared/lib/server-utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { PrivacyPolicyView } from '@/features/privacy-policy/views/privacy-policy-view';

export async function getStaticProps(ctx: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string)),
    },
  };
}

export default PrivacyPolicyView;
