import { AuthErrorActions } from '@/app/(app)/[locale]/(rest)/auth/error/actions';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

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

  const authPath = withOptionalCustomBasePath('/auth/signin');

  const redirectTarget =
    resolvedSearchParams.redirect || resolvedSearchParams.callbackUrl;
  const signInPath = redirectTarget
    ? `${authPath}?redirect=${encodeURIComponent(String(redirectTarget))}`
    : authPath;

  const keycloakLogoutPath = withOptionalCustomBasePath(
    `/api/auth/keycloak-logout?next=${encodeURIComponent(signInPath)}`,
  );

  const newLayoutEnabled = appConfig?.newLayout?.enabled;
  const logoUrl = newLayoutEnabled
    ? appConfig?.newLayout?.logoUrl
    : appConfig?.brand?.logoUrl;
  const brandName = appConfig?.brand?.name?.trim() || '';
  const logoAlt = brandName ? `${brandName} home page` : 'Home';

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-8 px-4 py-16">
      <Image
        src={logoUrl || ''}
        alt={logoAlt}
        width={200}
        height={56}
        className="max-h-14 w-auto object-contain"
        priority
      />

      {/* Card */}
      <div className="w-full rounded-xl border bg-white p-8 shadow-sm">
        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle
              className="size-7 text-destructive"
              aria-hidden="true"
            />
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-center text-2xl font-semibold text-foreground">
          {content.title}
        </h1>

        {/* Description */}
        <p className="mb-8 text-center text-base leading-relaxed text-muted-foreground">
          {content.description}
        </p>

        {/* Primary action */}
        <div className="flex flex-col items-center gap-3">
          <AuthErrorActions
            keycloakLogoutPath={keycloakLogoutPath}
            tryAgainLabel={t('auth_error.logout_and_try_again', {
              ns: 'common',
            })}
          />
        </div>
      </div>
    </main>
  );
}
