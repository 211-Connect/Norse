import { SessionProvider } from 'next-auth/react';
import { PrevUrlProvider } from '@/lib/context/PrevUrl';
import { PageView } from '@/components/organisms/PageView';
import { CookiesProvider } from 'react-cookie';
import { Provider as JotaiProvider } from 'jotai';
import { AppConfigProvider } from '../context/app-config-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ session, appConfig, children }) {
  return (
    <JotaiProvider>
      <PageView />

      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>
          <AppConfigProvider value={appConfig}>
            <CookiesProvider>
              <PrevUrlProvider>{children}</PrevUrlProvider>
            </CookiesProvider>
          </AppConfigProvider>
        </SessionProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
