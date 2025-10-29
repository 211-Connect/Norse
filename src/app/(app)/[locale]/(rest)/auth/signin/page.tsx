import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { signIn } from 'next-auth/react';

export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { query } = (await searchParams) ?? {};

  const defaultCallbackUrl =
    appConfig.i18n.defaultLocale === locale
      ? '/favorites'
      : `/${locale}/favorites`;

  signIn('keycloak', {
    callbackUrl: (query?.redirect as string) ?? defaultCallbackUrl,
  });

  return null;
}
