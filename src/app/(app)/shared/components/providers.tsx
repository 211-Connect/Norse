'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';

import { AppConfigProvider } from '../context/app-config-provider';
import { PrevUrlProvider } from '../context/prev-url-provider';
import { withOptionalCustomBasePath } from '../lib/utils';
import { GlobalAtomsHydration } from './global-atoms-hydration';
import { PageView } from './page-view';

const queryClient = new QueryClient();

export function Providers({ appConfig, children, device, fontSize, session }) {
  return (
    <SessionProvider
      basePath={withOptionalCustomBasePath('/api/auth')}
      session={session}
    >
      <QueryClientProvider client={queryClient}>
        <AppConfigProvider value={appConfig}>
          <JotaiProvider>
            <GlobalAtomsHydration device={device} fontSize={fontSize}>
              <PrevUrlProvider>
                <NextTopLoader
                  color="hsl(var(--primary))"
                  showSpinner={false}
                  height={2}
                  crawlSpeed={25}
                  speed={100}
                  template='<div class="bar" role="bar" aria-hidden="true" data-testid="toploader-bar"><div class="peg"></div></div>'
                />
                <PageView />
                {children}
              </PrevUrlProvider>
            </GlobalAtomsHydration>
          </JotaiProvider>
        </AppConfigProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
