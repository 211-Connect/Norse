'use server';

import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { defaultLocale, isValidLocale, locales } from '@/payload/i18n/locales';

const ERROR_I18N_NAMESPACES = ['page-500', 'common'];

export async function getErrorTranslationData(locale: string) {
  const resolvedLocale = isValidLocale(locale) ? locale : defaultLocale;

  const { resources } = await initTranslations(
    resolvedLocale,
    ERROR_I18N_NAMESPACES,
    locales,
    defaultLocale,
  );

  return {
    i18nNamespaces: ERROR_I18N_NAMESPACES,
    resources,
    locale: resolvedLocale,
  };
}
