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
} from '../components/organisms/modals';
import { AppProps } from 'next/app';

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const appConfig = useAppConfig();

  return (
    <>
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
              }}
            >
              <PrevUrlProvider>
                <Component {...pageProps} />
                <GoogleTagManagerScript />
              </PrevUrlProvider>
            </ModalsProvider>
          </MantineProvider>
        </CookiesProvider>
      </SessionProvider>
    </>
  );
}

export default appWithTranslation(App);
