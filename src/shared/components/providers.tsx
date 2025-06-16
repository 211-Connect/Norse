import getConfig from 'next/config';
import { SessionProvider } from 'next-auth/react';
import { CookiesProvider } from 'react-cookie';
import { Provider as JotaiProvider } from 'jotai';
import { AppConfigProvider } from '../context/app-config-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageView } from './page-view';
import { PrevUrlProvider } from '../context/prev-url-provider';
import { FlagsProvider } from '../context/flags-provider';
import { useRouter } from 'next/router';

const queryClient = new QueryClient();

export function Providers({ session, appConfig, flags, children }) {
  const { basePath } = useRouter();

  return (
    <JotaiProvider>
      <PageView />
      <QueryClientProvider client={queryClient}>
        <SessionProvider basePath={`${basePath}/api/auth`} session={session}>
          <FlagsProvider value={flags}>
            <AppConfigProvider value={appConfig}>
              <CookiesProvider>
                <PrevUrlProvider>{children}</PrevUrlProvider>
              </CookiesProvider>
            </AppConfigProvider>
          </FlagsProvider>
        </SessionProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
