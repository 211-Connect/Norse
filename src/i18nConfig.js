import { getAppConfig } from './app/shared/lib/appConfig';
const appConfig = getAppConfig();

const i18nConfig = {
  defaultLocale: appConfig?.nextConfig?.i18n?.defaultLocale ?? 'en',
  locales: appConfig?.nextConfig?.i18n?.locales ?? ['en'],
};

export default i18nConfig;
