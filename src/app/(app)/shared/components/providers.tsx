'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppConfigProvider } from '../context/app-config-provider';
import { PageView } from './page-view';
import { PrevUrlProvider } from '../context/prev-url-provider';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient();

export function Providers({ appConfig, children, session }) {
  return (
    <SessionProvider basePath="/api/auth" session={session}>
      <PageView />
      <QueryClientProvider client={queryClient}>
        <AppConfigProvider value={appConfig}>
          <PrevUrlProvider>{children}</PrevUrlProvider>
        </AppConfigProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
