import { createInstance, type i18n } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';

/**
 * Builds a standalone i18n instance for the *selected print locale*,
 * independent of the app's ambient/current-UI language. Always registers
 * the dynamic backend (never receives preloaded `resources`) so it can
 * load any tenant locale on demand, and sets `fallbackLng` to the tenant's
 * default locale so any translation missing for the selected locale falls
 * back to the default automatically (i18next's per-key fallback behavior).
 *
 * Used to wrap the rendered PDF `Document` element in its own
 * `I18nextProvider` so static PDF text (datum labels, disclaimer, etc.)
 * localizes to the directory's chosen language rather than the visitor's
 * current UI language.
 */
export async function createPrintI18nInstance(
  locale: string,
  defaultLocale: string,
  namespaces: string[] = ['page-list'],
): Promise<i18n> {
  const instance = createInstance();

  instance.use(initReactI18next);
  instance.use(
    resourcesToBackend((language, namespace) => {
      return import(`@/../public/locales/${language}/${namespace}.json`);
    }),
  );

  await instance.init({
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: [locale, defaultLocale],
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: [locale, defaultLocale],
  });

  return instance;
}
