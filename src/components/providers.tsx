import { SessionProvider } from 'next-auth/react';
import { PrevUrlProvider } from '@/hooks/use-prev-url';
import { useHydrateAtoms } from 'jotai/react/utils';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientAtom } from 'jotai-tanstack-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { SuggestionsProvider } from '@/components/search/hooks/use-suggestions';
import { AppConfigProvider } from '@/hooks/use-app-config';
import { CategoriesProvider } from '@/components/home/categories/hooks/use-categories';

const queryClient = new QueryClient();
const HydrateAtoms = ({ children }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

export default function Providers({
  session,
  suggestions,
  appConfig,
  categories,
  children,
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <CookiesProvider>
          <HydrateAtoms>
            <TooltipProvider>
              <SuggestionsProvider value={suggestions || []}>
                <AppConfigProvider value={appConfig || {}}>
                  <CategoriesProvider value={categories || []}>
                    <PrevUrlProvider>{children}</PrevUrlProvider>
                  </CategoriesProvider>
                </AppConfigProvider>
              </SuggestionsProvider>
            </TooltipProvider>
          </HydrateAtoms>
        </CookiesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
