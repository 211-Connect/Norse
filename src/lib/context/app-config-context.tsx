'use client';
import { AppConfig } from '@/types/app-config';
import { createContext, useContext } from 'react';

const appConfigContext = createContext<AppConfig | undefined | null>(undefined);

type AppConfigProviderProps = {
  value: AppConfig | null;
  children: React.ReactNode;
};

export function AppConfigProvider({ value, children }: AppConfigProviderProps) {
  return (
    <appConfigContext.Provider value={value}>
      {children}
    </appConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(appConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
}
