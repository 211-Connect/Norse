import { i18n, Resource } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getGlobalI18nInstance, initGlobalI18n } from './i18n-instance';

async function initTranslations(
  locale: string,
  namespaces: string[],
  enabledLocales: string[],
  defaultLocale: string,
  i18nInstance?: i18n,
  resources?: Resource,
) {
  // If an instance is provided (client-side/tests), use it.
  if (i18nInstance) {
    i18nInstance.use(initReactI18next);
    if (!resources) {
      i18nInstance.use(
        resourcesToBackend((language, namespace) => {
          return import(`@/../public/locales/${language}/${namespace}.json`);
        }),
      );
    }
    await i18nInstance.init({
      lng: locale,
      resources,
      fallbackLng: defaultLocale,
      supportedLngs: enabledLocales,
      defaultNS: namespaces[0],
      fallbackNS: namespaces[0],
      ns: namespaces,
      preload: resources ? [] : enabledLocales,
    });

    return {
      i18n: i18nInstance,
      resources: i18nInstance.services.resourceStore.data,
      t: i18nInstance.t,
    };
  }

  // Ensure global instance is initialized (safe to call multiple times)
  await initGlobalI18n(enabledLocales, defaultLocale);
  const globalInstance = getGlobalI18nInstance();

  // Load namespaces required for this page if not present
  if (namespaces.length > 0) {
    await globalInstance.loadNamespaces(namespaces);
  }

  const t = globalInstance.getFixedT(locale, namespaces[0]);

  const resultResources = {
    [locale]: globalInstance.services.resourceStore.data[locale] || {},
  };
  if (locale !== defaultLocale) {
    resultResources[defaultLocale] =
      globalInstance.services.resourceStore.data[defaultLocale] || {};
  }

  return {
    i18n: globalInstance, // Keep referencing global, but prefer using 't' and 'resources'
    resources: resultResources,
    t: t,
  };
}

export default initTranslations;
