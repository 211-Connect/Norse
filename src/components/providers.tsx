import { SessionProvider } from 'next-auth/react';
import { MantineProvider } from '@mantine/core';
import { Theme } from '../lib/theme/main';
import { PrevUrlProvider } from '../lib/context/PrevUrl';
import { useHydrateAtoms } from 'jotai/react/utils';
import { CookiesProvider } from 'react-cookie';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientAtom } from 'jotai-tanstack-query';
import { UpdateLocationModal } from '../components/modals';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { SuggestionsProvider } from '@/lib/hooks/use-suggestions';

const queryClient = new QueryClient();
const HydrateAtoms = ({ children }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

export default function Providers({ session, suggestions, children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <CookiesProvider>
          <HydrateAtoms>
            <MantineProvider withGlobalStyles withNormalizeCSS theme={Theme}>
              <ModalsProvider
                modals={{
                  'update-location': UpdateLocationModal,
                }}
              >
                <TooltipProvider>
                  <SuggestionsProvider value={suggestions || []}>
                    <PrevUrlProvider>{children}</PrevUrlProvider>
                  </SuggestionsProvider>
                </TooltipProvider>
              </ModalsProvider>
            </MantineProvider>
          </HydrateAtoms>
        </CookiesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
