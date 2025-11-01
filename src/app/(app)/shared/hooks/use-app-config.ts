import { useContext } from 'react';
import { appConfigContext } from '../context/app-config-context';
import { AppConfig } from '@/types/appConfig';

export function useAppConfig(): AppConfig {
  const appConfig = useContext(appConfigContext);
  return appConfig!;
}
