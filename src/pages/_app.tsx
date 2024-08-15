import '@/shared/styles/globals.css';
import Head from 'next/head';
import { appWithTranslation } from 'next-i18next';
import { AppProps } from 'next/app';
import { Open_Sans } from 'next/font/google';
import { ErrorBoundary } from '@/features/error/components/error-boundary';
import { cn } from '@/shared/lib/utils';
import { Header } from '@/shared/components/header';
import { Footer } from '@/shared/components/footer';
import { Providers } from '@/shared/components/providers';
import { GoogleTagManagerScript } from '@/shared/components/google-tag-manager-script';
import { Toaster } from '@/shared/components/ui/sonner';
import { useHydrateAtoms } from 'jotai/utils';
import {
  resultsAtom,
  resultsCurrentPageAtom,
  resultTotalAtom,
} from '@/shared/store/results';
import { useHydrateAndSyncAtoms } from '@/shared/hooks/use-hydrate-and-sync-atoms';
import { searchAtom } from '@/shared/store/search';
import { JotaiHydration } from '@/shared/components/jotai-hydration';

const fontSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function App({
  Component,
  pageProps: { session, appConfig, ...pageProps },
}: AppProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Providers session={session} appConfig={appConfig}>
        <JotaiHydration pageProps={pageProps} />

        <ErrorBoundary>
          <Header />
          <main
            className={cn(
              'flex flex-1 flex-col font-sans antialiased',
              fontSans.variable,
            )}
          >
            <Component {...pageProps} />
          </main>
          <Footer />
          <GoogleTagManagerScript />
          <Toaster />
        </ErrorBoundary>
      </Providers>
    </div>
  );
}

export default appWithTranslation(App);
