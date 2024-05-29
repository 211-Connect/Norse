import { createContext, useContext } from 'react';
import { IAppConfig } from './types/IAppConfig';

const appConfigContext = createContext<{}>({});

export const AppConfigProvider = appConfigContext.Provider;

export function useAppConfig(): IAppConfig {
  const appConfig = useContext(appConfigContext);
  return appConfig;
}
