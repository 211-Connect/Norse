import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { PrevUrlProvider } from '@/lib/context/PrevUrl';
import { PageView } from '@/components/organisms/PageView';
import { Theme } from '@/lib/theme/main';
import { CookiesProvider } from 'react-cookie';
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
} from '@/components/organisms/modals';

export function Providers({ session, children }) {
  return (
    <>
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
              <PrevUrlProvider>{children}</PrevUrlProvider>
            </ModalsProvider>
          </MantineProvider>
        </CookiesProvider>
      </SessionProvider>
    </>
  );
}
