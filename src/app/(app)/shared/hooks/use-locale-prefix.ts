'use client';

import { useTranslation } from 'react-i18next';

import { useAppConfig } from './use-app-config';

/**
 * The path prefix of the page's locale: `''` for the tenant's default locale, `/es` (etc.) otherwise.
 *
 * Prefix client navigations with it so the URL itself carries the language. An unprefixed path is resolved
 * by the proxy from the `NEXT_LOCALE` cookie, which costs a redirect for a non-default locale and ties the
 * page's language to whatever the cookie says at that moment.
 */
export function useLocalePrefix(): string {
  const { i18n } = useTranslation();
  const { defaultLocale } = useAppConfig().i18n;
  const locale = i18n.language;
  return locale && locale !== defaultLocale ? `/${locale}` : '';
}
