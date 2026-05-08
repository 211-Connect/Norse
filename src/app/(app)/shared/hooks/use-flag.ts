'use client';

import { AppConfig } from '@/types/appConfig';

import { useAppConfig } from './use-app-config';

export function useFlag(flag: keyof AppConfig['featureFlags']) {
  const appConfig = useAppConfig();
  return appConfig.featureFlags[flag];
}
