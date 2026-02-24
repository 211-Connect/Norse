'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NextTopLoader from 'nextjs-toploader';

import { AppConfigProvider } from '../context/app-config-provider';
import { PageView } from './page-view';
import { PrevUrlProvider } from '../context/prev-url-provider';
import { SessionProvider } from 'next-auth/react';

const queryClient = new QueryClient();

export function Providers({ appConfig, children, session }) {
  return (
    <SessionProvider
      basePath={`${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/api/auth`}
      session={session}
    >
      <QueryClientProvider client={queryClient}>
        <AppConfigProvider value={appConfig}>
          <PrevUrlProvider>
            <NextTopLoader
              color="hsl(var(--primary))"
              showSpinner={false}
              height={2}
              crawlSpeed={25}
              speed={100}
            />
            <PageView />
            {children}
          </PrevUrlProvider>
        </AppConfigProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
