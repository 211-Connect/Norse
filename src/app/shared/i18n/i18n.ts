import { createInstance, i18n, Resource } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import i18nConfig from '@/i18nConfig';
import { cache } from 'react';

async function initTranslations(
  locale: string,
  namespaces: string[],
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
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: resources ? [] : i18nConfig.locales,
  });

  const resultResources = {
    [locale]: i18nInstance.services.resourceStore.data[locale],
  };
  if (locale !== i18nConfig.defaultLocale) {
    resultResources[i18nConfig.defaultLocale] =
      i18nInstance.services.resourceStore.data[i18nConfig.defaultLocale];
  }

  return {
    i18n: i18nInstance,
    resources: resultResources,
    t: i18nInstance.t,
  };
}

export default cache(initTranslations);
