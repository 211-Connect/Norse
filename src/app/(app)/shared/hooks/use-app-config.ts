import { AppConfig } from '@/types/appConfig';
import { useContext } from 'react';

import { appConfigContext } from '../context/app-config-context';

export function useAppConfig(): AppConfig {
  const appConfig = useContext(appConfigContext);
  return appConfig!;
}
