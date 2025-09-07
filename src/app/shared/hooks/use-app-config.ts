'use client';

import { useContext } from 'react';
import { appConfigContext } from '../context/app-config-context';

export function useAppConfig() {
  const appConfig = useContext(appConfigContext);
  return appConfig;
}
