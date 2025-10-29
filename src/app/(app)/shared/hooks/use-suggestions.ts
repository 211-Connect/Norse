'use client';

import { useAppConfig } from './use-app-config';

export function useSuggestions() {
  const appConfig = useAppConfig();
  return appConfig.suggestions;
}
