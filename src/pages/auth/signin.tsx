import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideAppConfig()),
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string)),
    },
  };
}

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      signIn('keycloak', {
        callbackUrl: (router?.query?.redirect as string) ?? '/favorites',
      });
    }
  }, [router.isReady, router.query.redirect]);

  return null;
}
