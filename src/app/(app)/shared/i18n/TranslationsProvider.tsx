'use client';

import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import initTranslations from './i18n';

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}) {
  const i18n = createInstance();
  const appConfig = useAppConfig();

  initTranslations(
    locale,
    namespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
    i18n,
    resources,
  );

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
