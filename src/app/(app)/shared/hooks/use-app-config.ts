import { useContext } from 'react';

import { AppConfig } from '@/types/appConfig';

import { appConfigContext } from '../context/app-config-context';

export function useAppConfig(): AppConfig {
  const appConfig = useContext(appConfigContext);
  return appConfig!;
}
