import { SessionProvider } from 'next-auth/react';
import { useHydrateAtoms } from 'jotai/react/utils';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientAtom } from 'jotai-tanstack-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { AppConfigProvider } from '@/hooks/use-app-config';
// import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient();
const HydrateAtoms = ({ children }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

export default function Providers({ session, appConfig, children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <CookiesProvider>
          <HydrateAtoms>
            <TooltipProvider>
              <AppConfigProvider value={appConfig || {}}>
                {/* <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                > */}
                {children}
                {/* </ThemeProvider> */}
              </AppConfigProvider>
            </TooltipProvider>
          </HydrateAtoms>
        </CookiesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
