import { createContext, useContext } from 'react';

const appConfigContext = createContext<{}>({});

export const AppConfigProvider = appConfigContext.Provider;

export function useAppConfig() {
  const appConfig = useContext(appConfigContext);
  return appConfig as any; // COME BACK AND TYPE THIS
}
