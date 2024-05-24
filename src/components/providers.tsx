import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Theme } from '../lib/theme/main';
import { Notifications } from '@mantine/notifications';
import { PrevUrlProvider } from '../lib/context/PrevUrl';
import { useHydrateAtoms } from 'jotai/react/utils';
import { CookiesProvider } from 'react-cookie';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientAtom } from 'jotai-tanstack-query';
import {
  AddToFavoritesModal,
  SendSmsModal,
  ShareModal,
  PromptAuthModal,
  UpdateLocationModal,
} from '../components/modals';

const queryClient = new QueryClient();
const HydrateAtoms = ({ children }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

export default function Providers({ session, children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <CookiesProvider>
          <HydrateAtoms>
            <MantineProvider withGlobalStyles withNormalizeCSS theme={Theme}>
              <Notifications />
              <ModalsProvider
                modals={{
                  share: ShareModal,
                  'add-to-favorites': AddToFavoritesModal,
                  sms: SendSmsModal,
                  'prompt-auth': PromptAuthModal,
                  'update-location': UpdateLocationModal,
                }}
              >
                <PrevUrlProvider>{children}</PrevUrlProvider>
              </ModalsProvider>
            </MantineProvider>
          </HydrateAtoms>
        </CookiesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
