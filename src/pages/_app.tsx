import { appWithTranslation } from 'next-i18next';
import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Theme } from '../lib/theme/main';
import { Notifications } from '@mantine/notifications';
import { PrevUrlProvider } from '../lib/context/PrevUrl';
import { PageView } from '../components/organisms/PageView';
import Head from 'next/head';
import { GoogleTagManagerScript } from '../components/atoms/GoogleTagManagerScript';
import { CookiesProvider } from 'react-cookie';
import { useAppConfig } from '../lib/hooks/useAppConfig';
import { ModalsProvider } from '@mantine/modals';
import {
  AddToFavoritesModal,
  CreateFavoriteListModal,
  DeleteFavoriteListModal,
  RemoveFavoriteFromListModal,
  SendSmsModal,
  ShareModal,
  UpdateFavoriteListModal,
  PromptAuthModal,
  UpdateLocationModal,
} from '../components/organisms/modals';
import { AppProps } from 'next/app';
import ErrorBoundary from '../components/organisms/error-boundary';
import '@/shared/styles/globals.css';
import { Open_Sans } from 'next/font/google';
import { cn } from '@/shared/lib/utils';
import { Header } from '@/shared/components/header';
import { Footer } from '@/shared/components/footer';

const fontSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const appConfig = useAppConfig();

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={appConfig?.brand?.faviconUrl ?? '/favicon'} />
      </Head>

      <PageView />

      <SessionProvider session={session}>
        <CookiesProvider>
          <MantineProvider withGlobalStyles withNormalizeCSS theme={Theme}>
            <Notifications />
            <ModalsProvider
              modals={{
                share: ShareModal,
                'add-to-favorites': AddToFavoritesModal,
                sms: SendSmsModal,
                'prompt-auth': PromptAuthModal,
                'create-list': CreateFavoriteListModal,
                'update-list': UpdateFavoriteListModal,
                'remove-from-list': RemoveFavoriteFromListModal,
                'delete-list': DeleteFavoriteListModal,
                'update-location': UpdateLocationModal,
              }}
            >
              <PrevUrlProvider>
                <ErrorBoundary appConfig={appConfig}>
                  <Header />
                  <main
                    className={cn(
                      'font-sans antialiased flex-1',
                      fontSans.variable
                    )}
                  >
                    <Component {...pageProps} />
                  </main>
                  <Footer />
                </ErrorBoundary>
                <GoogleTagManagerScript />
              </PrevUrlProvider>
            </ModalsProvider>
          </MantineProvider>
        </CookiesProvider>
      </SessionProvider>
    </div>
  );
}

export default appWithTranslation(App);
