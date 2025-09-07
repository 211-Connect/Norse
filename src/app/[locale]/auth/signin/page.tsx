import i18nConfig from '@/i18nConfig';
import { signIn } from 'next-auth/react';

export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const { query } = (await searchParams) ?? {};

  const defaultCallbackUrl =
    i18nConfig.defaultLocale === locale ? '/favorites' : `/${locale}/favorites`;

  signIn('keycloak', {
    callbackUrl: (query?.redirect as string) ?? defaultCallbackUrl,
  });

  return null;
}
