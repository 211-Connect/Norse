import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { PrevUrlProvider } from '@/lib/context/PrevUrl';
import { PageView } from '@/components/organisms/PageView';
import { Theme } from '@/lib/theme/main';
import { CookiesProvider } from 'react-cookie';
import { ModalsProvider } from '@mantine/modals';
import { Provider as JotaiProvider } from 'jotai';
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
} from '@/components/organisms/modals';
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
                  <PrevUrlProvider>{children}</PrevUrlProvider>
                </ModalsProvider>
              </MantineProvider>
            </CookiesProvider>
          </AppConfigProvider>
        </SessionProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
