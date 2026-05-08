import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { SignInTrigger } from './signin-trigger';
import { createLogger } from '@/lib/logger';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

const log = createLogger('signin-page');

export default async function SignInPage({ params, searchParams }) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);
  const resolvedSearchParams = (await searchParams) ?? {};

  const defaultCallbackUrl =
    appConfig.i18n.defaultLocale === locale
      ? '/favorites'
      : `/${locale}/favorites`;

  const callbackUrl = withOptionalCustomBasePath(
    resolvedSearchParams.redirect ||
      resolvedSearchParams.callbackUrl ||
      defaultCallbackUrl,
  );

  if (resolvedSearchParams.error) {
    log.error(
      `Error on sign-in page: ${resolvedSearchParams.error_description || resolvedSearchParams.error}`,
    );

    return (
      <div>Unexpected error occurred during sign-in. Please try again.</div>
    );
  }

  return <SignInTrigger callbackUrl={callbackUrl} />;
}
