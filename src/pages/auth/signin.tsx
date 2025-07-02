import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

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
      const callbackUrl = encodeURIComponent(
        (router?.query?.redirect as string) ?? '/favorites'
      );
      if (process.env.NEXT_PUBLIC_ENABLE_TRAILING_SLASH_REMOVAL === 'true') {
        // Manually redirect to the correct endpoint with trailing slash
        window.location.href = `/api/auth/signin/keycloak/?callbackUrl=${callbackUrl}`;
      } else {
        // Default NextAuth signIn behavior
        import('next-auth/react').then(({ signIn }) => {
          signIn('keycloak', {
            callbackUrl: (router?.query?.redirect as string) ?? '/favorites',
          });
        });
      }
    }
  }, [router.isReady, router.query.redirect]);

  return null;
}
