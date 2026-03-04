import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { SignInTrigger } from './signin-trigger';

export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const { query } = (await searchParams) ?? {};

  const defaultCallbackUrl =
    appConfig.i18n.defaultLocale === locale
      ? '/favorites'
      : `/${locale}/favorites`;

  const callbackUrl = (query?.redirect as string) ?? defaultCallbackUrl;

  return <SignInTrigger callbackUrl={callbackUrl} />;
}
