import { createInstance, i18n } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';

// Use a symbol to store the global instance to prevent namespace collisions
// and ensure persistence across HMR in development.
const I18N_INSTANCE_KEY = Symbol.for('next_i18next_instance');
const I18N_INIT_PROMISE_KEY = Symbol.for('next_i18next_init_promise');

type GlobalWithI18n = typeof globalThis & {
  [I18N_INSTANCE_KEY]?: i18n;
  [I18N_INIT_PROMISE_KEY]?: Promise<void>;
};

const globalWithI18n = globalThis as GlobalWithI18n;

function getOptions(locale: string = 'en', namespaces: string[] = []) {
  return {
    lng: locale,
    fallbackLng: 'en', // This should match appConfig or be passed in
    supportedLngs: [
      'en',
      'am',
      'ar',
      'es',
      'fr',
      'so',
      'sw',
      'uk',
      'ne',
      'ff',
      'om',
    ], // ideally imported from config
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
  };
}

export const getGlobalI18nInstance = () => {
  if (!globalWithI18n[I18N_INSTANCE_KEY]) {
    const instance = createInstance();
    instance.use(initReactI18next);
    instance.use(
      resourcesToBackend((language: string, namespace: string) => {
        return import(`@/../public/locales/${language}/${namespace}.json`);
      }),
    );
    globalWithI18n[I18N_INSTANCE_KEY] = instance;
  }
  return globalWithI18n[I18N_INSTANCE_KEY]!;
};

export const initGlobalI18n = (
  enabledLocales: string[],
  defaultLocale: string,
) => {
  const instance = getGlobalI18nInstance();

  if (!globalWithI18n[I18N_INIT_PROMISE_KEY]) {
    globalWithI18n[I18N_INIT_PROMISE_KEY] = instance.init({
      supportedLngs: enabledLocales,
      fallbackLng: defaultLocale,
      preload: [], // Lazy load to prevent memory spikes on startup
    }) as Promise<unknown> as Promise<void>;
  }

  return globalWithI18n[I18N_INIT_PROMISE_KEY]!;
};
