import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Theme } from '../lib/theme/main';
import { Notifications } from '@mantine/notifications';
import { PrevUrlProvider } from '../lib/context/PrevUrl';

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
} from '../components/modals';

export default function Providers({ session, children }) {
  return (
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
  );
}
