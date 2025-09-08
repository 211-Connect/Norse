'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppConfigProvider } from '../context/app-config-provider';
import { PageView } from './page-view';
import { PrevUrlProvider } from '../context/prev-url-provider';
import { FlagsProvider } from '../context/flags-provider';
import { AuthProvider } from '../context/auth-provider';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient();

export function Providers({ appConfig, flags, children, auth, session }) {
  return (
    <SessionProvider basePath="/api/auth" session={session}>
      <PageView />
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={auth}>
          <FlagsProvider value={flags}>
            <AppConfigProvider value={appConfig}>
              <PrevUrlProvider>{children}</PrevUrlProvider>
            </AppConfigProvider>
          </FlagsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
