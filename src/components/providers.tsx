import { SessionProvider } from 'next-auth/react';
import { PrevUrlProvider } from '../lib/context/PrevUrl';
import { useHydrateAtoms } from 'jotai/react/utils';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientAtom } from 'jotai-tanstack-query';
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
            <TooltipProvider>
              <SuggestionsProvider value={suggestions || []}>
                <PrevUrlProvider>{children}</PrevUrlProvider>
              </SuggestionsProvider>
            </TooltipProvider>
          </HydrateAtoms>
        </CookiesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
