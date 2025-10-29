import { useContext, useEffect, useMemo, useState } from 'react';
import { appConfigContext } from '../context/app-config-context';
import { useTranslation } from 'react-i18next';
import { AppConfig } from '@/types/appConfig';

export function useAppConfig(): AppConfig {
  const appConfig = useContext(appConfigContext);
  return appConfig!;
}
