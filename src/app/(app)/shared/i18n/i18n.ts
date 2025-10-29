import { createInstance, i18n, Resource } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { cache } from 'react';

async function initTranslations(
  locale: string,
  namespaces: string[],
  enabledLocales: string[],
  defaultLocale: string,
  i18nInstance?: i18n,
  resources?: Resource,
) {
  i18nInstance = i18nInstance || createInstance();

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

  const resultResources = {
    [locale]: i18nInstance.services.resourceStore.data[locale],
  };
  if (locale !== defaultLocale) {
    resultResources[defaultLocale] =
      i18nInstance.services.resourceStore.data[defaultLocale];
  }

  return {
    i18n: i18nInstance,
    resources: resultResources,
    t: i18nInstance.t,
  };
}

export default cache(initTranslations);
