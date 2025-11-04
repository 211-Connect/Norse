import { useContext, useEffect, useMemo, useState } from 'react';
import { AppConfig, appConfigContext } from '../context/app-config-context';
import { useTranslation } from 'next-i18next';

export type TranslatedAppConfig = Omit<AppConfig, 'translatedConfig'> &
  AppConfig['translatedConfig'][string];

export function useAppConfig(): TranslatedAppConfig {
  const { i18n } = useTranslation('common');
  const appConfig = useContext(appConfigContext);

  const translatedConfig = useMemo(() => {
    const { translatedConfig, ...rest } = appConfig;
    return {
      ...rest,
      ...(translatedConfig[i18n.language] || {}),
    };
  }, [appConfig, i18n.language]);

  return translatedConfig;
}
