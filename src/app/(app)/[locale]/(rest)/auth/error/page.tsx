import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { AuthErrorActions } from '@/app/(app)/[locale]/(rest)/auth/error/actions';

const i18nNamespaces = ['common'];

export default async function AuthErrorPage({ params, searchParams }) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const appConfig = await getAppConfigWithoutHost(locale);
  const { t } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  const errorCode = String(resolvedSearchParams.error || 'default');
  const content =
    errorCode === 'AccessDenied'
      ? {
          title: t('auth_error.access_denied_title', { ns: 'common' }),
          description: t('auth_error.access_denied_description', {
            ns: 'common',
          }),
        }
      : {
          title: t('auth_error.default_title', { ns: 'common' }),
          description: t('auth_error.default_description', { ns: 'common' }),
        };

  const authPath = `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/auth/signin`;

  const redirectTarget =
    resolvedSearchParams.redirect || resolvedSearchParams.callbackUrl;
  const signInPath = redirectTarget
    ? `${authPath}?redirect=${encodeURIComponent(String(redirectTarget))}`
    : authPath;

  const keycloakLogoutPath = `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/api/auth/keycloak-logout?next=${encodeURIComponent(signInPath)}`;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-12">
      <div className="flex flex-col items-center rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-3xl font-semibold text-foreground">
          {content.title}
        </h1>
        <p className="mb-6 text-muted-foreground">{content.description}</p>
        <AuthErrorActions
          keycloakLogoutPath={keycloakLogoutPath}
          tryAgainLabel={t('auth_error.logout_and_try_again', { ns: 'common' })}
        />
      </div>
    </main>
  );
}
