import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { SignInTrigger } from './signin-trigger';

function normalizeCallbackUrl(callbackUrl: string): string {
  const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

  if (
    !callbackUrl ||
    callbackUrl.startsWith('http://') ||
    callbackUrl.startsWith('https://')
  ) {
    return callbackUrl;
  }

  if (
    !basePath ||
    callbackUrl === basePath ||
    callbackUrl.startsWith(`${basePath}/`)
  ) {
    return callbackUrl;
  }

  if (!callbackUrl.startsWith('/')) {
    return `${basePath}/${callbackUrl}`;
  }

  return `${basePath}${callbackUrl}`;
}

export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const resolvedSearchParams = (await searchParams) ?? {};

  const defaultCallbackUrl =
    appConfig.i18n.defaultLocale === locale
      ? '/favorites'
      : `/${locale}/favorites`;

  const callbackUrl = normalizeCallbackUrl(
    resolvedSearchParams.redirect ||
      resolvedSearchParams.callbackUrl ||
      defaultCallbackUrl,
  );

  return <SignInTrigger callbackUrl={callbackUrl} />;
}
