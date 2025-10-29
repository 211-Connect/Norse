'use client';

import { useAppConfig } from './use-app-config';
import { AppConfig } from '@/types/appConfig';

export function useFlag(flag: keyof AppConfig['featureFlags']) {
  const appConfig = useAppConfig();
  return appConfig.featureFlags[flag];
}
