'use client';

import { useAppConfig } from './use-app-config';

export function useTopics() {
  const appConfig = useAppConfig();
  return appConfig.topics?.list;
}
